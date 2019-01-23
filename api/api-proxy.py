#!/usr/bin/env python3

import os
import sys
import cgi
import cgitb
import codecs
from urllib.parse import urlencode
from urllib.request import build_opener
import requests
from urllib.error import HTTPError
from json import dumps, loads

#cgitb.enable()

# Fix lacking LANG env
sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

def req(url, data=None, method="GET"):
	r = requests.request(method, url, params=data) if method == "GET" else requests.request(method, url, data=data)
	return r.text

def json_out(string, *headers):
	print("Content-type: application/json")
	for a in headers:
		print(a)
	print()
	print(string)

base = "https://api.challonge.com/v1"
data = loads(sys.stdin.read())


api_data = data["api_data"]

# Request logging.
# log = open("data.log", "a+")
# log.write(dumps(api_data) + "\n")
# log.close()

if "utility" in api_data:
	utility = api_data["utility"]
	if utility == "user_search":
		url = "http://challonge.com/users/search?" + urlencode({ "q": api_data["q"] })
		json_out(req(url))
	elif utility == "url_check":
		url = "http://challonge.com/" + api_data["identifier"]
		r = requests.request("GET", url)
		if r.status_code == 404:
			json_out(dumps({ "valid": True, "message": "OK" }))
		else:
			json_out(dumps({ "valid": False, "message": "Taken" }))
	else:
		json_out(dumps({ "error": "Unknown utility: " + utility }), "Status: 500")
else:
	method = data["method"]
	endpoint = data["endpoint"]

	url = base + endpoint
	try:
		if method == "GET" or method == "POST" or method == "PUT" or method == "DELETE":
			json_out(req(url, api_data, method))
		else:
			json_out(dumps({ "error": "Unknown method: " + method }), "Status: 500")
	except HTTPError as e:
		json_out(dumps({ "message": e.msg }), "Status: " + str(e.code))
