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

@app.route('/create', methods=['POST'])
def create_message():
    request_json = request.get_json()
    if not request_json:
        abort(404)
    res = db.chats1.insert(request_json)
    return jsonify(res)


# #Creating a collection
# db.language.insert({"id": "1", "name": "C", "grade":"Boring"})
# db.language.insert({"id": "2", "name":"Python", "grade":"Interesting"})
#
# #Reading it
# print "After create\n",list(db.language.find())
#
# #Updating the collection
# db.language.update({"name":"C"}, {"$set":{"grade":"Make it interesting"}})
# print "After update\n",list(db.language.find())
#
# #Deleting the collection
# db.language.drop()
# print "After delete\n", list(db.language.find())


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


@app.route('/')
def hello_world():
  return 'Hello from Flask!'

if __name__ == '__main__':
  app.run()
