
from flask import Flask, redirect
from twilio.twiml.messaging_response import MessagingResponse
from flask import request as frequest
import urllib.request as urllibrequest
import urllib.error
import json
import re
# import dialogflow_v2 as dialogflow
import dialogflow_v2beta1 
import os
import http.client, urllib.parse, uuid

app = Flask(__name__)

FIREBASE_BASE_URL = 'https://globalhack-2018.firebaseio.com/'

LANGUAGES_MAP = {
    'english': 'en',
    'en': 'en',
    'spanish': 'es',
    'espanol': 'es',
    'español': 'es',
    'es': 'es',
    'sp': 'es'
}

TEXT_MAP = {
    'start-over': 'Enter \'restart\' at any time to start over.',
    'phase-1': 'Welcome! We will give you local resources curated by St. Louis Immigrant Services. Please tell us your language of choice.',
    'phase0': 'Sorry, we only support English and Spanish (Espanol) right now. Enter English or Spanish.',
    'phase1': 'Please tell us what you need or enter one of the following categories: Health, Childcare, Employment, Legal.',
    'phase1mess': 'Please clarify what you need or enter one of the following categories: Health, Childcare, Employment, Legal.',
    'phase2': 'We can help with that. What is your zipcode?',
    'phase2mess': 'Sorry, I didn\'t get that. Please enter a 5-digit zipcode.',
}

CUSTOM_TEXT_MAP = {
    ('childcare', 3): 'Is your child ages 0-3?',
    ('healthcare', 3): 'Do you have health insurance?',
    ('legal', 3): 'Are you able to provide proof of documentation?',
    ('employment', 3): 'Are you able to provide proof of documentation?'
}

def update_firebase(node, value_dict):
    json_data = json.dumps(value_dict).encode()
    request = urllibrequest.Request(FIREBASE_BASE_URL + 'chatbot/' + node + '.json', data=json_data, method='PATCH')
    try:
        loader = urllibrequest.urlopen(request)
    except urllib.error.URLError as e:
        message = json.loads(e.read())
        print(message['error'])
    else:
        print('Firebase Update:', loader.read())
        
        
def read_user_firebase(node):
    request = urllibrequest.Request(FIREBASE_BASE_URL + 'chatbot/' + node + '.json', method='GET')
    try:
        loader = urllibrequest.urlopen(request)
    except urllib.error.URLError as e:
        message = json.loads(e.read())
        print(message['error'])
    else:
        read = loader.read()
        my_json = read.decode('utf8').replace("'", '"')
        data = json.loads(my_json)
        return data
        
def translate(text, lang):
    subscriptionKey = '79019ab8e4784d9e8f2a1daf956c7435'
    host = 'api.cognitive.microsofttranslator.com'
    path = '/translate?api-version=3.0'    
    params = "&to=" + lang;
    def call_translate(content):
        headers = {
            'Ocp-Apim-Subscription-Key': subscriptionKey,
            'Content-type': 'application/json',
            'X-ClientTraceId': str(uuid.uuid4())
        }

        conn = http.client.HTTPSConnection(host)
        conn.request ("POST", path + params, content, headers)
        response = conn.getresponse()
        # print(response.read()[0])
        return response.read()
    requestBody = [{
        'Text' : text,
    }]
    content = json.dumps(requestBody, ensure_ascii=False).encode('utf-8')
    result = call_translate(content)
    result.decode('utf8').replace("'", '"')
    json_res = json.loads(result.decode('utf8').replace("'", '"'))
    return json_res[0]['translations'][0]['text']
    
def read_services_firebase(intent):
    request = urllibrequest.Request(FIREBASE_BASE_URL + 'web-app/provider-lists/' + intent + '-providers.json', method='GET')
    try:
        loader = urllibrequest.urlopen(request)
    except urllib.error.URLError as e:
        message = json.loads(e.read())
        print(message['error'])
    else:
        read = loader.read()
        my_json = read.decode('utf8').replace("'", '"')
        data = json.loads(my_json)
        return data
            
def detect_intent(text):
    text = text.lower()
    if 'health' in text or 'bless you' in text:
        return 'healthcare'
    elif 'childcare' in text:
        return 'childcare'
    elif 'employ' in text:
        return 'employment'
    elif 'legal' in text:
        return 'legal'
    else:
        return 'none'

def detect_lang(text):
    text = text.lower()
    if text in LANGUAGES_MAP:
        return LANGUAGES_MAP[text]
    else:
        return 'none'
    
def clean_zip(zip):
    zip = re.sub('[^0-9]','', zip)
    return zip
    
def detect_intent_dialogflow(text):
    os.environ['GOOGLE_APPLICATION_CREDENTIALS']='./globalhack7safetynetbot-cd8c283a33e7.json'
    client = dialogflow_v2beta1.SessionsClient()
    session = client.session_path('globalhack7safetynetbot', 213)
    text_input = dialogflow_v2beta1.types.TextInput(text=text, language_code='en') 
    query_input = dialogflow_v2beta1.types.QueryInput(text=text_input) 
    response = client.detect_intent(session, query_input)
    return str(response.query_result.intent.display_name)
    
    
def get_msg(msg_type):
    if msg_type in TEXT_MAP:
        print(msg_type)
        return TEXT_MAP[msg_type]
    else:
        return msg_type
        
def get_custom_msg(msg_type, phase):
    print("MESSAGE TYPE", msg_type, "phase", phase)
    if (msg_type, phase) in CUSTOM_TEXT_MAP:
        return CUSTOM_TEXT_MAP[(msg_type, phase)]
    else:
        return msg_type
        
def parse_yes_no(text):
    text = text.lower()
    if 'yes' in text or 'y' in text or 'si' in text or 'sí' in text:
        return 'yes'
    elif 'no' in text or 'n' in text:
        return 'no'
    else:
        return 'none'
        
def create_msg_response(resp_messages, curr_lang):
    resp = MessagingResponse()
    if curr_lang == 'es':
        for i in range(len(resp_messages)):
            resp_messages[i] = translate(resp_messages[i], 'es')
    for msg in resp_messages:
        resp.message(msg)
    return resp
        
        
#TODO: support custom filters and determine how to get questions. add espanol.
@app.route('/sms', methods=['GET', 'POST'])
def sms_reply():
    print("SERVOCES", read_services_firebase('childcare'))
    phone_id = re.sub(r'\W+', '', frequest.form['From'])
    message_body = frequest.form['Body']
    curr_info = read_user_firebase(phone_id)
    curr_phase = 0
    curr_intent = 'none'
    curr_lang = 'none'
    resp_messages = []
    if curr_info and 'phase' in curr_info:
        print("CURR PHASE IS ", curr_info['phase'])
        curr_phase = curr_info['phase']
        if 'restart' in message_body.lower() or 'reiniciar' in message_body.lower():
            curr_phase = 0
            resp_messages.append(get_msg('phase-1'))
            update_firebase(phone_id, None)
            update_firebase(phone_id, {'phase': 0})
            return str(create_msg_response(resp_messages, 'en'))
    else:
        #new user
        resp_messages.append(get_msg('phase-1'))
        resp_messages.append(get_msg('start-over'))
        update_firebase(phone_id, {'phase': 0})
        return str(create_msg_response(resp_messages, 'en'))
    if curr_phase == 0:
        curr_lang = detect_lang(message_body)
        if curr_lang == 'none':
            resp_messages.append(get_msg('phase0'))
        else:
            update_firebase(phone_id, {'lang': curr_lang})
            update_firebase(phone_id, {'phase': 1})
            resp_messages.append(get_msg('phase1'))
    elif curr_phase > 0:
        curr_lang = curr_info['lang']
        if curr_lang == 'es':
            message_body = translate(message_body, 'en')
            print("MESSAGE BODY IS NOW ", message_body)
        
    if curr_phase == 1:
        #Trying to understand their problem
        curr_intent = detect_intent(message_body)
        if curr_intent == 'none':
            # try with NLP!
            curr_intent = detect_intent(detect_intent_dialogflow(message_body))
            if curr_intent not in ('healthcare', 'childcare', 'legal', 'employment'):
                curr_intent = 'none'
            print("CURR INTENT WAS", curr_intent)
        if curr_intent == 'none':
            resp_messages.append(get_msg('phase1mess'))
        else:
            resp_messages.append('That sounds like you need ' + curr_intent + ' resources.')
            update_firebase(phone_id, {'intent': curr_intent})
            update_firebase(phone_id, {'phase': 2})
            resp_messages.append(get_msg('phase2'))
    elif curr_phase > 1:
        curr_lang = curr_info['lang']
        curr_intent = curr_info['intent']
    if curr_phase == 2:
        zipcode = clean_zip(message_body)
        if len(zipcode) == 5:
            update_firebase(phone_id, {'zipcode': int(zipcode)})
            update_firebase(phone_id, {'phase': 3})
            resp_messages.append('We will look for resources near you. ' + get_custom_msg(curr_intent, curr_phase + 1))
        else:
            resp_messages.append(get_msg('phase2mess'))
    elif curr_phase > 2:
        curr_lang = curr_info['lang']
        curr_intent = curr_info['intent']
        curr_zipcode = curr_info['zipcode']
    if curr_phase == 3:
        print("CURR PHASE IS 3. VERIFY FILTER QUESTION.")
    # custom questions
    if curr_phase == 4 and curr_intent == 'childcare':
        print("ya")

    return str(create_msg_response(resp_messages, curr_lang))
# all chatbot code goes in directory called chatbot

            
if __name__ == '__main__':
    app.run(debug=True)