from django.shortcuts import render

import zerorpc
import json
import time
import threading

from django.http import HttpResponse
from django.template import RequestContext, loader

tickdata = []


def index(request):
    template = loader.get_template('interface/index.html')
    thread1 = threading.Thread(target=scanTickData)
    thread1.start()
    return HttpResponse(template.render())

def getWeekData(request):
    global client
    try:
        client = zerorpc.Client()
        client.connect("tcp://127.0.0.1:4242")
        curdata = client.getWeekData()
    except Exception as e:
        print e
    return HttpResponse(json.dumps(curdata, ensure_ascii=False), content_type="application/json")

def getWeekArray(request):
    global client
    try:
        client = zerorpc.Client()
        client.connect("tcp://127.0.0.1:4242")
        curdata = client.getWeekDataArray()
    except Exception as e:
        print e
    return HttpResponse(json.dumps(curdata, ensure_ascii=False), content_type="application/json")

def getArrByVar(request):
    global client
    try:
        data = request.GET
        variable = json.loads(data['variable'])
        client = zerorpc.Client()
        client.connect("tcp://127.0.0.1:4242")
        curdata = client.getArrByVar(variable)
    except Exception as e:
        print e
    return HttpResponse(json.dumps(curdata, ensure_ascii=False), content_type="application/json")

def getTickData(request):
    global tickdata
    return HttpResponse(json.dumps(tickdata, ensure_ascii=False), content_type="application/json")

def scanTickData():
    global tickdata
    try:
        client = zerorpc.Client()
        client.connect("tcp://127.0.0.1:4242")
        while True:
            time.sleep(1)
            tickdata = client.getTick()
    except Exception as e:
        print e