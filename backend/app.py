# -*- coding: utf-8 -*-

from flask import Flask
import os,sys
import json
import timeit
import apiai

from flask import Flask, jsonify, request, abort
from flask_cors import CORS
from codes import API_KEY,CLIENT_ACCESS_TOKEN
import pyteaser

app = Flask(__name__)
CORS(app)
from googletrans import Translator
from paralleldots import set_api_key
from paralleldots import sentiment

translator = Translator()
set_api_key(API_KEY)


# import pymongo
from pymongo import MongoClient

client = MongoClient('146.185.169.151', 27017)
db = client.test_database
collection = db.chats1
collection2 = db.users1


@app.route('/chat', methods=['POST'])
def create_message():
    request_json = request.get_json()
    print request_json
    if not request_json:
        abort(404)
    res = db.chats1.insert(request_json)
    if res:
        res = {
            "response": "Success"
        }
    return jsonify(res)

@app.route('/chat', methods=['GET'])
def read_message():
    request_json = request.values
    print request_json
    if not request_json:
        raise
    user1 = request_json.get("user1", "ara")
    user2 = request_json.get("user2", "anand")
    res = db.chats1.find(
        {
            "$or":[{"from": user1, "to": user2}, {"from": user2, "to": user1}]
        }
    )
    lis = []
    for element in res:
        element.pop('_id')
        lis.append(element)
    return jsonify(lis)

@app.route('/message-list', methods=['GET'])
def get_last_k_messages():
    request_json = request.values
    print request_json
    if not request_json:
        raise
    to_user = request_json.get("to", "anand")
    res = db.chats1.find({"to":to_user}).sort("_id", -1)
    # lis = []
    # from_set = set()

    _element = {}
    for element in res:
        element.pop('_id')
        print element
        _element = element
        break
    return jsonify(_element)
    #     if element['from'] in from_set:
    #         continue
    #     else:
    #         from_set.add(element['from'])
    #         lis.append(element)
    # return jsonify(lis)

@app.route('/chat', methods=['DELETE'])
def delete_message():
    request_json = request.get_json()
    if not request_json:
        print('you have to pass the condition, otherwise I will delete everything')
        db.chats1.drop()
    return jsonify({})

@app.route('/summarize', methods=['POST'])
def summarize():
    request_json = request.get_json()
    if not request_json:
        abort(404)
    return jsonify({"summary": pyteaser.Summarize("", request_json.get('text', ""))[0]})


@app.route('/user', methods=['POST'])
def create_user():
    request_json = request.get_json()
    print request_json
    if not request_json:
        abort(404)
    obj_id = db.users1.insert(request_json)
    if obj_id:
        res = {
            "response": "Success",
            "user_id": str(obj_id)
        }
    else:
        res = {
            "response": "Failure"
        }
    return jsonify(res)

@app.route('/user', methods=['GET'])
def read_user():
    request_json = request.get_json()
    if not request_json:
        pass
    res = db.users1.find()
    lis = []
    for element in res:
        element.pop('_id')
        lis.append(element)
    return jsonify(lis)


@app.route('/user', methods=['DELETE'])
def delete_user():
    request_json = request.get_json()
    if not request_json:
        print('you have to pass the condition, otherwise I will delete everything')
        db.users1.drop()
    return jsonify({})


@app.route('/translate', methods=['GET'])
def translate_api_call():
    resp = dict()
    text = request.values.get('text', '')
    dest = request.values.get('dest', 'en')
    print(text)
    x = translator.translate(text, dest=dest)
    resp['value'] = x.text
    return jsonify(resp)

@app.route('/sentiment', methods=['GET'])
def sentiment_api_call():
    resp = dict()
    text = request.values.get('text', '')
    x = sentiment(str(text))
    resp = x
    return jsonify(resp)

@app.route('/parser', methods=['POST'])
def parse_time():
    request_json = request.get_json()
    print request_json
    if not request_json:
        abort(404)
    q = request_json.get('query', '')
    ai = apiai.ApiAI(CLIENT_ACCESS_TOKEN)

    req = ai.text_request()

    req.lang = 'en'  # optional, default value equal 'en'

    req.session_id = "<SESSION ID, UNIQUE FOR EACH USER>"

    req.query = q #"Can we set up a meeting at 8 pm"

    response = req.getresponse()

    data = json.loads(response.read())
    intent = data["result"]["metadata"]["intentName"]
    resp = data["result"]["parameters"]
    resp["intent"] = intent
    return jsonify(resp)

# @app.route('/')
# def hello_world():
#   return 'Hello from Flask!'

if __name__ == '__main__':
  app.run()
