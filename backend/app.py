# -*- coding: utf-8 -*-

from flask import Flask
import boto3
from googletrans import Translator
translator = Translator()
import os,sys
import json
import timeit

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route('/translate', methods=['GET'])
def translate_api_call():
    resp = dict()
    x = translator.translate('hoe gaat het?')
    resp['value'] = x.text
    return jsonify(resp)

@app.route('/')
def hello_world():
  return 'Hello from Flask!'

if __name__ == '__main__':
  app.run()
