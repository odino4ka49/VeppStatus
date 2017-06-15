
import zerorpc
import sys
import zmq

"""port = "5556"

context = zmq.Context()
socket = context.socket(zmq.SUB)

socket.connect ("tcp://localhost:%s" % port)

topicfilter = "tickdata"
socket.setsockopt(zmq.SUBSCRIBE, topicfilter)

string = socket.recv()
messagedata = string
print messagedata"""


"""c = zerorpc.Client()
c.connect("tcp://127.0.0.1:4242")
print c.testCountIntegral()
"""
val = 12.002
print round(val,2)