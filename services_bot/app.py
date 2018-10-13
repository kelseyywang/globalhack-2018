from flask import Flask, redirect
from twilio.twiml.messaging_response import MessagingResponse
from flask import request as frequest
import urllib.request as urllibrequest
import urllib.error
import json

app = Flask(__name__)

@app.route("/sms", methods=['GET', 'POST'])
def sms_reply():
    message_body = frequest.form['Body']
    my_data = dict()
    my_data["test"] = "test data for firebase"

    json_data = json.dumps(my_data).encode()
    request = urllibrequest.Request("https://globalhack-2018.firebaseio.com/test.json", data=json_data, method="PATCH")

    try:
        loader = urllibrequest.urlopen(request)
    except urllib.error.URLError as e:
        message = json.loads(e.read())
        print(message["error"])
    else:
        print(loader.read())
    my_response = "you said " + message_body
    print(my_response)
    resp = MessagingResponse()
    resp.message(my_response)
    return str(resp)
# all chatbot code goes in directory called chatbot

            
if __name__ == "__main__":
    app.run(debug=True)