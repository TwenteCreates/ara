# -*- coding: utf-8 -*-

from flask import Flask
import boto3
import os,sys
import json
import timeit

from flask import Flask, jsonify, request
from flask_cors import CORS
from codes import API_KEY

app = Flask(__name__)
CORS(app)
from googletrans import Translator
from paralleldots import set_api_key
from paralleldots import sentiment

translator = Translator()
set_api_key(API_KEY)

@app.route('/translate', methods=['GET'])
def translate_api_call():
    resp = dict()
    x = translator.translate('hoe gaat het?')
    resp['value'] = x.text
    return jsonify(resp)

@app.route('/sentiment', methods=['GET'])
def sentiment_api_call():
    resp = dict()
    x = sentiment("It is going to be difficult")
    resp = x
    return jsonify(resp)


@app.route('/')
def hello_world():
  return 'Hello from Flask!'

if __name__ == '__main__':
  app.run()
