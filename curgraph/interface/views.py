from django.shortcuts import render

import zerorpc
import json
import time
import threading
import zmq
import psycopg2
import gzip
from datetime import date, datetime
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

def vepp3(request):
    template = loader.get_template('interface/v3.html')
    thread1 = threading.Thread(target=scanTickData)
    thread1.start()
    thread2 = threading.Thread(target=receiveBigData)
    thread2.start()
    return HttpResponse(template.render())

def vepp4(request):
    template = loader.get_template('interface/v4.html')
    thread1 = threading.Thread(target=scanTickData)
    thread1.start()
    thread2 = threading.Thread(target=receiveBigData)
    thread2.start()
    return HttpResponse(template.render())

def getProgramData(request):
    programdata = []
    try:
        print(f"🔍 Подключение к БД: dbname=v4 user=vepp4 host=pg port=5432")
        conn = psycopg2.connect("dbname=v4 user=vepp4 host=192.168.144.4 port=5432")
        cur = conn.cursor()
        duty = 1 if (datetime.now().hour < 21) else 2
        today_date = date.today().isoformat()
        print(f"📅 Запрос данных на {today_date}, смена: {duty}")
        
        # Используем правильный синтаксис для psycopg2
        query = "SELECT ddate, dname, program, nduty FROM ttvduty WHERE ddate = %s AND nduty = %s"
        print(f"🔍 SQL запрос: {query}")
        print(f"📋 Параметры: ddate='{today_date}', nduty={duty}")
        cur.execute(query, (today_date, duty))
        rows = cur.fetchall()
        
        print(f"📊 Получено строк из БД: {len(rows)}")
        if rows:
            row = rows[0]
            print(f"📋 Данные из БД: {row}")
            if isinstance(row, tuple):
                # Декодируем из koi8-r в utf-8
                dname = row[1].decode('koi8-r').encode('utf-8').decode('utf-8') if row[1] else ""
                program = row[2].decode('koi8-r').encode('utf-8').decode('utf-8') if row[2] else ""
                programdata = [dname, program]
                print(f"✅ Обработанные данные: {programdata}")
            else:
                print(f"⚠️ Неожиданный формат данных: {type(row)}")
                programdata = ["",""]
        else:
            print("❌ Нет данных в БД для указанной даты и смены")
            programdata = ["",""]
            
        cur.close()
        conn.close()
        print("🔌 Соединение с БД закрыто")
        
    except Exception as e:
        print(f"❌ Ошибка при работе с БД: {e}")
        print(f"📋 Тип ошибки: {type(e).__name__}")
        programdata = ["",""]
    
    print(f"📤 Отправляем данные: {programdata}")
    return HttpResponse(json.dumps(programdata, ensure_ascii=False), content_type="application/json")

def getWeekData(request):
    global client
    curdata = []  # Инициализируем переменную по умолчанию
    try:
        client = zerorpc.Client()
        client.connect("tcp://127.0.0.1:4242")
        curdata = client.getWeekData()
        print(f"📊 Получено недельных данных: {len(curdata) if isinstance(curdata, list) else 'не список'}")
    except Exception as e:
        print(f"❌ Ошибка в getWeekData: {e}")
        curdata = []  # Возвращаем пустой список при ошибке
    
    return HttpResponse(json.dumps(curdata, ensure_ascii=False), content_type="application/json")

def getWeekArray(request):
    """Возвращает недельные данные с пагинацией"""
    global client
    curdata = []  # Инициализируем переменную по умолчанию
    
    # Получаем параметры пагинации
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('pageSize', 1000))  # По умолчанию 1000 записей
    start_time = request.GET.get('start', None)
    end_time = request.GET.get('end', None)
    
    try:
        client = zerorpc.Client()
        client.connect("tcp://127.0.0.1:4242")
        
        if start_time and end_time:
            # Загружаем данные по диапазону времени
            curdata = client.getWeekDataRange(float(start_time), float(end_time), page_size)
        else:
            # Загружаем данные с пагинацией
            curdata = client.getWeekDataPage(page, page_size)
        
        print(f"📊 Получено недельных данных: {len(curdata) if isinstance(curdata, list) else 'не список'} (страница {page}, размер {page_size})")
    except Exception as e:
        print(f"❌ Ошибка в getWeekArray: {e}")
        curdata = []  # Возвращаем пустой список при ошибке
    
    # Создаем JSON ответ
    json_data = json.dumps(curdata, ensure_ascii=False)
    
    # Проверяем, поддерживает ли клиент gzip
    accept_encoding = request.META.get('HTTP_ACCEPT_ENCODING', '')
    if 'gzip' in accept_encoding and len(json_data) > 1024:  # Сжимаем только большие ответы
        compressed_data = gzip.compress(json_data.encode('utf-8'))
        response = HttpResponse(compressed_data, content_type="application/json")
        response['Content-Encoding'] = 'gzip'
        response['Content-Length'] = len(compressed_data)
        print(f"📦 Ответ сжат: {len(json_data)} -> {len(compressed_data)} байт")
        return response
    else:
        return HttpResponse(json_data, content_type="application/json")

def getArrByVar(request):
    """Возвращает данные по переменной с сжатием"""
    global client,bigsocket
    curdata = []  # Инициализируем переменную по умолчанию
    try:
        data = request.GET
        variable = json.loads(data['variable'])
        start = json.loads(data['start'])
        end = json.loads(data['end'])
        freq = json.loads(data['freq'])
        print(f"🔍 Запрос данных: variable={variable}, start={start}, end={end}, freq={freq}")
        
        client = zerorpc.Client()
        client.connect("tcp://127.0.0.1:4242")
        curdata = client.getArrByVar(variable,start,end,freq)
        print(f"📊 Получено данных: {len(curdata) if isinstance(curdata, list) else 'не список'}")
    except Exception as e:
        print(f"❌ Ошибка в getArrByVar: {e}")
        print(f"📋 Тип ошибки: {type(e).__name__}")
        curdata = []  # Возвращаем пустой список при ошибке
    
    # Создаем JSON ответ
    json_data = json.dumps(curdata, ensure_ascii=False)
    
    # Проверяем, поддерживает ли клиент gzip
    accept_encoding = request.META.get('HTTP_ACCEPT_ENCODING', '')
    if 'gzip' in accept_encoding and len(json_data) > 1024:  # Сжимаем только большие ответы
        compressed_data = gzip.compress(json_data.encode('utf-8'))
        response = HttpResponse(compressed_data, content_type="application/json")
        response['Content-Encoding'] = 'gzip'
        response['Content-Length'] = len(compressed_data)
        print(f"📦 Ответ сжат: {len(json_data)} -> {len(compressed_data)} байт")
        return response
    else:
        return HttpResponse(json_data, content_type="application/json")

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
        print(e)