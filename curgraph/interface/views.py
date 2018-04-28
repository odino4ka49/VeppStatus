from django.shortcuts import render

import zerorpc
import json
import time
import threading
import zmq
from django.http import HttpResponse
from django.template import RequestContext, loader

tickdata = []
bigsocket = ""

def index(request):
    template = loader.get_template('interface/index.html')
    thread1 = threading.Thread(target=scanTickData)
    thread1.start()
    thread2 = threading.Thread(target=receiveBigData)
    thread2.start()
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
    global client,bigsocket
    try:
        data = request.GET
        variable = json.loads(data['variable'])
        start = json.loads(data['start'])
        end = json.loads(data['end'])
        client = zerorpc.Client()
        client.connect("tcp://127.0.0.1:4242")
        curdata = client.getArrByVar(variable,start,end)
        """bigsocket.send_string("getArrByVar "+variable+" "+str(start)+" "+str(end))
        message = bigsocket.recv()
        curdata = json.loads(message)"""
    except Exception as e:
        print e
    return HttpResponse(json.dumps(curdata, ensure_ascii=False), content_type="application/json")

def getTickData(request):
    global tickdata
    return HttpResponse(json.dumps(tickdata, ensure_ascii=False), content_type="application/json")

def receiveBigData():
    global bigsocket
    port = "5554"
    context = zmq.Context()
    bigsocket = context.socket(zmq.REQ)
    bigsocket.connect ("tcp://localhost:%s" % port)

def scanTickData():
    global tickdata
    try:
        client = zerorpc.Client()
        client.connect("tcp://127.0.0.1:4242")
        while True:
            time.sleep(1)
            newtickdata = client.getTick()
            tickdata = newtickdata
        """port = "5556"
        context = zmq.Context()
        print "here"
        socket = context.socket(zmq.SUB)
        socket.connect ("tcp://localhost:%s" % port)
        topicfilter = "tickdata"
        socket.setsockopt(zmq.SUBSCRIBE, topicfilter)
        while True:
            string = socket.recv()
            message = string[9:]
            tickdata = json.loads(message)"""
    except Exception as e:
        print e