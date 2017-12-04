__author__ = '1ka'

from cothread.catools import *

from PyQt4 import QtCore # import PyQt
from PyQt4.QtCore import QTimer
import pycx4.qcda as cda # import qcda

import time
import json
import os
import logging
import sys
import threading
import atexit
import zerorpc
import zmq
import copy

import signal
signal.signal(signal.SIGINT, signal.SIG_DFL)


class ServerRPC(object):
    """def getWeekData(self):
        global week_data
        return week_data"""
    def getWeekDataArray(self):
        global week_data_arr
        return week_data_arr
    def getArrByVar(self,variable,start,end):
        global week_data_arr
        result = []
        for shot in week_data_arr:
            if shot[0] > start and shot[0] < end:
                result.append([shot[0]*1000,shot[getVariablePosition(variable)]])
        return result
    def getTick(self):
        global curshot
        return curshot
    def testCountIntegral(self):
        global week_data_arr
        timestart = 1494986400
        prev = None
        timepos = getVariablePosition("time")
        integral = 0
        flag = getVariablePosition("V4_status_int")
        flag_values = [1,3]
        main_data = getVariablePosition("V4_total")
        for shot in week_data_arr:
            try:
                timecur = float(shot[timepos])
                if timecur>timestart:
                    if prev!=None:
                        timeprev = float(prev[timepos])
                        if shot[flag] in flag_values:
                            if prev[flag] in flag_values:
                                acur = (shot[main_data]+prev[main_data])/2.0
                                integral = integral+acur*(timecur-timeprev)/1000
                            else:
                                integral = integral+shot[main_data]*(timecur-timeprev)/2000
                        elif prev[flag] in flag_values:
                            integral = integral+prev[main_data]*(timecur-timeprev)/2000
                    prev = shot
            except Exception as e:
                print e
        return integral

def getVariablePosition(name):
    global status_list
    return status_list.index(next(x for x in status_list if x["Name"] == name))

def getVariableByPosition(pos):
    global status_list
    return status_list[pos]["Name"]

def readPvData():
    global pv_list,pv_data
    length = len(pv_list)
    pv_data = [0]*length
    for i in range(0,length):
        pv = str(pv_list[i]["Pv"])
        try:
            if "Datatype" in pv_list[i] and pv_list[i]["Datatype"]!="str":
                pv_data[i] = float(caget(pv))
            else:
                pv_data[i]=str(caget(pv,datatype=DBR_STRING))
        except Exception as e:
            pv_data[i] = 0

def readPv():
    global pv_list, curshot, tickevent
    for item in pv_list:
        pv = str(item["Pv"])
        curitem = next((x for x in curshot if x["Name"] == item["Name"]), None)
        try:
            if "Datatype" in item and item["Datatype"]=="str":
                curitem["Value"]=str(caget(pv,timeout=0.5,datatype=DBR_STRING))
            else:
                """value = caget(pv,timeout=0.5)
                if(value-int(value)!=0):
                    value = round(value,2)
                curitem["Value"] = value"""
                curitem["Value"] = float(caget(pv,timeout=0.5))
        except Exception as e:
            curitem["Value"] = 0

def templateFromList(list):
    template = {}
    for item in list:
        if "Name" in item:
            template[item["Name"]] = None
    return template

def shotFromList(list):
    shot = []
    for item in list:
        if "Name" in item:
            shot.append({"Name":item["Name"],"Value":None})
    return shot

def saveLine(line):
    global status_list, week_data_arr
    newline = []
    #week_data.append(line)
    strline = ""
    for item in status_list:
        strline += str(line[item["Name"]])+"|"
        newline.append(line[item["Name"]])
    week_data_arr.append(newline)
    with open(os.path.join(script_dir,"week_data"),'a') as f:
        f.write(strline+"\n")

def saveData():
    global status_list, curshot, week_data_arr, status_template
    newshot = copy.deepcopy(status_template)
    timenow=time.time()
    for item in status_list:
        if item["Name"] == "time":
            next((x for x in curshot if x["Name"] == "time"), None)["Value"] = timenow
            newshot["time"]=timenow
        elif not "Function" in item:
            pv = next((x for x in curshot if x["Name"] == item["Name"]), None)
            newshot[item["Name"]] = pv["Value"]
        else:
            func = item["Function"]
            value = 0
            if func["Name"] == "Substitution":
                flag = next((x for x in curshot if x["Name"] == func["Flag"]), None)["Value"]
                if flag in func["Flag_values"]:
                    value = next((x for x in curshot if x["Name"] == func["Substitute_data"]), None)["Value"]
                else:
                    value = next((x for x in curshot if x["Name"] == func["Main_data"]), None)["Value"]
            elif func["Name"] == "Total_current":
                flag = next((x for x in curshot if x["Name"] == func["Flag"]), None)["Value"]
                if flag in func["Flag_values"]:
                    value = next((x for x in curshot if x["Name"] == func["Main_data"]), None)["Value"]
                else:
                    value = "null"
            elif func["Name"] == "Mean":
                value1 = next((x for x in curshot if x["Name"] == func["Value1"]), None)["Value"]
                value2 = next((x for x in curshot if x["Name"] == func["Value2"]), None)["Value"]
                value = value1+value2/2.0
            elif func["Name"] == "Integration":
                timestamp = time.strftime("%H%M%S")
                if timestamp == "090000" or timestamp == "210000":
                    value = 0
                    item["Prevtime"] = timenow
                elif "Prevtime" in item:
                    prev = week_data_arr[-1]
                    flag = next((x for x in curshot if x["Name"] == func["Flag"]), None)["Value"]
                    flag_prev = prev[getVariablePosition(func["Flag"])]
                    flag_values = func["Flag_values"]
                    param=0.0
                    param_prev=0.0
                    denominator = func["Denominator"]
                    dt = timenow-item["Prevtime"]
                    integral_prev = prev[getVariablePosition(item["Name"])]
                    if isinstance(func["Parameter"],list):
                        n=0
                        for par in func["Parameter"]:
                            param+=next((x for x in curshot if x["Name"] == par), None)["Value"]
                            param_prev += prev[getVariablePosition(par)]
                            n+=1
                        if n!=0:
                            param=param/n
                            param_prev=param_prev/n
                    else:
                        param = next((x for x in curshot if x["Name"] == func["Parameter"]), None)["Value"]
                        param_prev = prev[getVariablePosition(func["Parameter"])]
                    if flag in flag_values:
                        if flag_prev in flag_values:
                            value = integral_prev+(param+param_prev)*dt/(2*denominator)
                        else:
                            value = integral_prev+(param)*dt/(2*denominator)
                    elif flag_prev in flag_values:
                            value = integral_prev+(param_prev)*dt/(2*denominator)
                    item["Prevtime"] = timenow
                else:
                    value = 0
            newshot[item["Name"]] = value
            next((x for x in curshot if x["Name"] == item["Name"]), None)["Value"] = value
        if type(newshot[item["Name"]])==float:
            newshot[item["Name"]] = round(newshot[item["Name"]],2)
            next((x for x in curshot if x["Name"] == item["Name"]))["Value"] = newshot[item["Name"]]
    saveLine(newshot)

def weekCheck():
    global week_data_arr,prev_hour
    timestamp = time.strftime("%H")
    if timestamp == "09" and prev_hour != "09":
        i=0
        cuttime = time.time() - 60*60*24*7
        for snapshot in week_data_arr:
            if float(snapshot[0])<cuttime:
                i+=1
            else:
                break
        week_data_arr = week_data_arr[i:]
        writeWeekData()
    prev_hour = timestamp

def loadWeekData():
    global week_data_arr, status_template
    lines = []
    with open(os.path.join(script_dir,"week_data"),'r') as f:
        lines = f.read().splitlines()
    for line in lines:
        snapshot = line[:-1].split("|")
        newline = []
        #newsnap = copy.deepcopy(status_template)
        idx = 0
        for item in snapshot:
            try:
                item = float(item)
                """if item.is_integer():
                    item = int(item)"""
            except ValueError:
                None
            #newsnap[getVariableByPosition(idx)]=item
            idx += 1
            newline.append(item)
        #week_data.append(newsnap)
        week_data_arr.append(newline)

def writeWeekData():
    global week_data_arr
    with open(os.path.join(script_dir,"week_data"),'w') as f:
        """for shot in week_data:
            strline = ""
            for key in shot:
                strline += str(shot[key])+"|"
            f.write(strline+"\n")"""
        for line in week_data_arr:
            strline = ""
            for item in line:
                strline += str(item)+"|"
            f.write(strline+"\n")

def getArrByVar(variable,start,end,frequency):
    global week_data_arr
    result = []
    i=0
    for shot in week_data_arr:
        if(i==frequency):
            if shot[0] > start and shot[0] < end:
                result.append([shot[0]*1000,shot[getVariablePosition(variable)]])
            i=0
        i+=1
    return result

def tick():
    readPv()
    saveData()
    weekCheck()

def openConfigFile(filename):
    with open(filename) as data_file:
        data = json.load(data_file)
    return data

def runserver():
    server = zerorpc.Server(ServerRPC())
    server.bind("tcp://0.0.0.0:4242")
    server.run()

#waits for data request from client
"""def runbasicserver():
    context = zmq.Context()
    socket = context.socket(zmq.REP)
    socket.bind("tcp://*:5555")
    while True:
        message = socket.recv()
        try:
            print("Received request: %s" % message)
            params = message.split()
            if params[0]=="getArrByVar" and len(params)==4:
                variable = params[1]
                start = int(params[2])
                end = int(params[3])
                result = getArrByVar(variable,start,end)
                jsonres = json.dumps(result)
                socket.send_string(json.dumps(result))
            else:
                socket.send(b"[]")
        except Exception as e:
            print e
            socket.send(b"[]")

def runpublisher():
    global curshot
    port = "5556"
    context = zmq.Context()
    socket = context.socket(zmq.PUB)
    socket.bind("tcp://*:%s" % port)
    while True:
        topic = "tickdata"
        messagedata = json.dumps(curshot)
        socket.send("%s %s" % (topic, messagedata))
        time.sleep(1)

def runcollecting():
    timer = QTimer()
    timer.timeout.connect(tick)
    timer.start(1000)"""

pv_data = []

#server.run()

script_dir = os.path.dirname(__file__)

pv_list = openConfigFile(os.path.join(script_dir,"pv_list.json"))
status_list = openConfigFile(os.path.join(script_dir,"status_list.json"))
status_template = templateFromList(status_list)
curshot = shotFromList(status_list)
week_data = []
week_data_arr = []
prev_hour = "09"

app = QtCore.QCoreApplication(sys.argv) # first you need Qt app

thread1 = threading.Thread(target=runserver)
thread1.start()
#thread2 = threading.Thread(target=runpublisher)
#thread2.start()

loadWeekData()
timer = QTimer()
timer.timeout.connect(tick)
timer.start(1000)

sys.exit(app.exec_())

