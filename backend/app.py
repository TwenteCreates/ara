# -*- coding: utf-8 -*-

from flask import Flask
import os,sys
import json
import timeit

from flask import Flask, jsonify, request, abort
from flask_cors import CORS
from codes import API_KEY

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
    request_json = request.get_json()
    if not request_json:
        pass
    res = db.chats1.find()
    lis = []
    for element in res:
        element.pop('_id')
        lis.append(element)
    return jsonify(lis)


@app.route('/chat', methods=['DELETE'])
def delete_message():
    request_json = request.get_json()
    if not request_json:
        print('you have to pass the condition, otherwise I will delete everything')
        db.chats1.drop()
    return jsonify({})



@app.route('/user', methods=['POST'])
def create_user():
    request_json = request.get_json()
    print request_json
    if not request_json:
        abort(404)
    obj_id = db.users1.insert(request_json)
    if obj_id:
        res = {
            "response": "Success"
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
def delete_message():
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

#
# @app.route('/')
# def hello_world():
#   return 'Hello from Flask!'

if __name__ == '__main__':
  app.run()
