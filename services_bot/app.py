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

app = Flask(__name__)

FIREBASE_BASE_URL = 'https://globalhack-2018.firebaseio.com/chatbot/'
FIREBASE_PATHS = {
    '':''
}

def update_firebase(node, value_dict):
    json_data = json.dumps(value_dict).encode()
    request = urllibrequest.Request(FIREBASE_BASE_URL + node + '.json', data=json_data, method='PATCH')
    try:
        loader = urllibrequest.urlopen(request)
    except urllib.error.URLError as e:
        message = json.loads(e.read())
        print(message['error'])
    else:
        print('Firebase Update:', loader.read())
        
        
def read_firebase(node):
    request = urllibrequest.Request(FIREBASE_BASE_URL + node + '.json', method='GET')
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
        
def detect_intent_dialogflow(project_id, session_id, texts, language_code):
    session_client = dialogflow.SessionsClient()
    session = session_client.session_path(project_id, session_id)
    print('Session path: {}\n'.format(session))
    
    for text in texts:
        text_input = dialogflow.types.TextInput(
            text=text, language_code=language_code)
    
        query_input = dialogflow.types.QueryInput(text=text_input)
    
        response = session_client.detect_intent(
            session=session, query_input=query_input)
    
        print('=' * 20)
        print('Query text: {}'.format(response.query_result.query_text))
        print('Detected intent: {} (confidence: {})\n'.format(
            response.query_result.intent.display_name,
            response.query_result.intent_detection_confidence))
        print('Fulfillment text: {}\n'.format(
            response.query_result.fulfillment_text))
            
def detect_intent(text):
    text = text.lower()
    if 'health' in text:
        return 'health'
    elif 'childcare' in text:
        return 'childcare'
    elif 'employment' in text:
        return 'employment'
    elif 'legal' in text:
        return 'legal'
    else:
        return 'none'

def clean_zip(zip):
    zip = re.sub('[^0-9]','', zip)
    return zip
    
def detect_intent_dialogflow2():
    os.environ['GOOGLE_APPLICATION_CREDENTIALS']='./globalhack7safetynetbot-cd8c283a33e7.json' 
    client = dialogflow_v2beta1.SessionsClient()
    session = client.session_path('globalhack7safetynetbot', 213) 
    text_input = dialogflow_v2beta1.types.TextInput(text='I need healing', language_code='en') 
    query_input = dialogflow_v2beta1.types.QueryInput(text=text_input) 
    # response = client.detect_intent(session=session, query_input=query_input) 
    response = client.detect_intent(session, query_input)
    print('RESPONSE', response)
        
@app.route('/sms', methods=['GET', 'POST'])
def sms_reply():
    detect_intent_dialogflow2()
    resp = MessagingResponse()
    phone_id = re.sub(r'\W+', '', frequest.form['From'])
    message_body = frequest.form['Body']
    curr_info = read_firebase(phone_id)
    curr_phase = 1
    curr_intent = 'none'
    if curr_info and 'phase' in curr_info:
        print("CURR PHASE IS ", curr_info['phase'])
        curr_phase = curr_info['phase']
    else:
        #new user
        resp.message('Welcome! We will give you local resources curated by St. Louis Immigrant Services. Please tell us your problem or enter one of the following categories: Health, Childcare, Employment, Legal.')
        update_firebase(phone_id, {'phase': 1})
        return str(resp)
    if curr_phase == 1:
        #Trying to understand their problem
        curr_intent = detect_intent(message_body)
        if curr_intent == 'none':
            resp.message('Please clarify your problem or enter one of the following categories: Health, Childcare, Employment, Legal.')
        else:
            update_firebase(phone_id, {'intent': curr_intent})
            update_firebase(phone_id, {'phase': 2})
            print("SHOULD MESSAGE.")
            resp.message('Great. What is your zipcode?')
    else:
        if 'intent' in curr_info:
            #intent should exist because you are > phase 1
            curr_intent = curr_info['intent']
        else:
            update_firebase(phone_id, {'phase': 1})
            update_firebase(phone_id, {'intent': 'none'})
    if curr_phase == 2:
        print('your intent is ', curr_intent, ' and your phase is ', curr_phase)
        zipcode = clean_zip(message_body)
        if len(zipcode) == 5:
            update_firebase(phone_id, {'intent': curr_intent})
            update_firebase(phone_id, {'zipcode': int(zipcode)})
            update_firebase(phone_id, {'phase': 3})
            resp.message('Thanks. Filter question!!')
        else:
            resp.message('Sorry, I didn\'t get that. Please enter a 5-digit zipcode.')
        if curr_phase == 3:
            resp.message('PHASE 3')
    return str(resp)
# all chatbot code goes in directory called chatbot

            
if __name__ == '__main__':
    app.run(debug=True)