__author__ = '1ka'

from cothread.catools import *

# PyQt4 заменен на threading.Timer для совместимости
# from PyQt4 import QtCore # import PyQt
# from PyQt4.QtCore import QTimer
# import pycx4.qcda as cda # import qcda - не используется

import time
import json
import os
import logging
import sys
import threading
import warnings
import psutil

# Подавляем предупреждения gevent_zeromq BUG
warnings.filterwarnings("ignore", message=".*gevent_zeromq.*")
warnings.filterwarnings("ignore", message=".*catching up after missing event.*")
warnings.filterwarnings("ignore", category=UserWarning)

# Подавляем stderr для gevent_zeromq
os.environ['GEVENT_SUPPORT'] = '0'

# Перенаправляем stderr для подавления gevent_zeromq BUG
class SuppressStderr:
    def __init__(self):
        self.stderr = sys.stderr
    
    def write(self, message):
        if 'gevent_zeromq BUG' not in message and 'catching up after missing event' not in message:
            self.stderr.write(message)
    
    def flush(self):
        self.stderr.flush()

# Применяем фильтр stderr
sys.stderr = SuppressStderr()

# Константы для ограничения памяти
MAX_WEEK_ENTRIES = 604800  # неделя в секундах (7 * 24 * 3600)
MAX_MEMORY_MB = 1000  # максимальное потребление памяти в МБ
MEMORY_CHECK_INTERVAL = 300  # проверка памяти каждые 5 минут

# Константы для кэширования
RECENT_CACHE_SIZE = 1000  # Размер кэша последних записей
CACHE_EXPIRY_SECONDS = 300  # Время жизни кэша в секундах

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
        """Возвращает данные из файла (ленивая загрузка)"""
        return loadWeekDataFromFile()
    
    def getWeekDataPage(self, page, page_size):
        """Возвращает данные с пагинацией"""
        return loadWeekDataPage(page, page_size)
    
    def getWeekDataRange(self, start_time, end_time, max_records):
        """Возвращает данные по диапазону времени"""
        return loadWeekDataRange(start_time, end_time, max_records)
    
    def getArrByVar(self,variable,start,end,frequency):
        """Возвращает данные по переменной за период (ленивая загрузка)"""
        return getArrByVarFromFile(variable, start, end, frequency)
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
                print(e)
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
                if "CutNegatives" in item and item["CutNegatives"]==True and curitem["Value"] < 0:
                    curitem["Value"] = 0
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
    global status_list, last_record, recent_cache
    newline = []
    strline = ""
    for item in status_list:
        strline += str(line[item["Name"]])+"|"
        newline.append(line[item["Name"]])
    
    # Сохраняем только последнюю запись для интеграции
    last_record = newline
    
    # Добавляем в кэш последних записей
    recent_cache.append(newline)
    if len(recent_cache) > RECENT_CACHE_SIZE:
        recent_cache.pop(0)  # Удаляем самую старую запись
    
    # Записываем в файл
    with open(os.path.join(script_dir,"week_data"),'a') as f:
        f.write(strline+"\n")

def saveData():
    global status_list, curshot, last_record, status_template
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
            elif func["Name"] == "Clip":
                flag = next((x for x in curshot if x["Name"] == func["Flag"]), None)["Value"]
                if flag > func["Min_flag_value"]:
                    value = next((x for x in curshot if x["Name"] == item["Name"]), None)["Value"]
                else:
                    value = func["Default_value"]
            elif func["Name"] == "Total_current":
                flag = next((x for x in curshot if x["Name"] == func["Flag"]), None)["Value"]
                if flag in func["Flag_values"]:
                    value = next((x for x in curshot if x["Name"] == func["Main_data"]), None)["Value"]
                else:
                    value = "null"
            elif func["Name"] == "Format":
                value = next((x for x in curshot if x["Name"] == func["Parameter"]), None)["Value"]*func["Coefficient"]
            elif func["Name"] == "Mean":
                value1 = next((x for x in curshot if x["Name"] == func["Value1"]), None)["Value"]
                value2 = next((x for x in curshot if x["Name"] == func["Value2"]), None)["Value"]
                value = value1+value2/2.0
            elif func["Name"] == "Integration":
                timestamp = time.strftime("%H%M%S")
                if timestamp == "090000" or timestamp == "210000":
                    value = 0
                elif "Prevtime" in item:
                    if last_record is None:
                        value = 0
                    else:
                        prev = last_record
                        flag = next((x for x in curshot if x["Name"] == func["Flag"]), None)["Value"]
                        flag_prev = prev[getVariablePosition(func["Flag"])]
                        flag_values = func["Flag_values"]
                        param=0.0
                        param_prev=0.0
                        denominator = func["Denominator"]
                        dt = timenow-item["Prevtime"]
                        integral_prev = prev[getVariablePosition(item["Name"])]
                        value = integral_prev
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
                                value += (param+param_prev)*dt/(2*denominator)
                            else:
                                value += (param)*dt/(2*denominator)
                        elif flag_prev in flag_values:
                            value += (param_prev)*dt/(2*denominator)
                item["Prevtime"] = timenow
            newshot[item["Name"]] = value
            next((x for x in curshot if x["Name"] == item["Name"]), None)["Value"] = value
        if type(newshot[item["Name"]])==float:
            newshot[item["Name"]] = round(newshot[item["Name"]],2)
            next((x for x in curshot if x["Name"] == item["Name"]))["Value"] = newshot[item["Name"]]
    saveLine(newshot)

def weekCheck():
    global prev_hour
    timestamp = time.strftime("%H")
    
    # Очистка файла от старых записей
    if timestamp != prev_hour:
        current_time = time.time()
        week_ago = current_time - (7 * 24 * 60 * 60)  # 7 дней назад
        
        # Читаем файл и удаляем старые записи
        cleanOldDataFromFile(week_ago)
        print(f"🧹 Очистка файла от записей старше недели (время: {timestamp}:00)")
    
    prev_hour = timestamp

def checkMemoryUsage():
    """Проверяет потребление памяти и выводит предупреждения"""
    global recent_cache
    
    try:
        process = psutil.Process(os.getpid())
        memory_mb = process.memory_info().rss / 1024 / 1024
        
        # Логируем потребление памяти каждые 5 минут
        if hasattr(checkMemoryUsage, 'last_check'):
            if time.time() - checkMemoryUsage.last_check > MEMORY_CHECK_INTERVAL:
                print(f"📊 Потребление памяти: {memory_mb:.1f} МБ, записей в кэше: {len(recent_cache)}")
                checkMemoryUsage.last_check = time.time()
        else:
            checkMemoryUsage.last_check = time.time()
        
        # Предупреждение при высоком потреблении памяти
        if memory_mb > MAX_MEMORY_MB:
            print(f"⚠️ ВЫСОКОЕ ПОТРЕБЛЕНИЕ ПАМЯТИ: {memory_mb:.1f} МБ (лимит: {MAX_MEMORY_MB} МБ)")
            print(f"📋 Записей в кэше: {len(recent_cache)}")
            
            # Принудительная очистка кэша при критическом потреблении
            if memory_mb > MAX_MEMORY_MB * 1.5:
                print("🚨 КРИТИЧЕСКОЕ ПОТРЕБЛЕНИЕ ПАМЯТИ - принудительная очистка кэша")
                recent_cache = recent_cache[-RECENT_CACHE_SIZE // 2:]
                print(f"🧹 Принудительно очищен кэш до {len(recent_cache)} записей")
        
        return memory_mb
    except Exception as e:
        print(f"❌ Ошибка при проверке памяти: {e}")
        return 0

def loadWeekDataFromFile():
    """Загружает данные из файла (ленивая загрузка)"""
    result = []
    try:
        with open(os.path.join(script_dir,"week_data"),'r') as f:
            for line in f:
                if line.strip():
                    items = line.strip().split('|')
                    newline = []
                    for i, item in enumerate(status_list):
                        if i < len(items):
                            if items[i] == "null":
                                newline.append(None)
                            else:
                                try:
                                    value = float(items[i])
                                    newline.append(value)
                                except ValueError:
                                    newline.append(items[i])
                        else:
                            newline.append(None)
                    result.append(newline)
    except FileNotFoundError:
        print("⚠️ Файл week_data не найден, возвращаем пустой список")
    except Exception as e:
        print(f"❌ Ошибка при чтении файла week_data: {e}")
    
    return result

def getArrByVarFromFile(variable, start, end, frequency):
    """Возвращает данные по переменной за период из файла"""
    result = []
    var_pos = getVariablePosition(variable)
    if var_pos is None:
        return result
    
    try:
        with open(os.path.join(script_dir,"week_data"),'r') as f:
            i = 0
            for line in f:
                if line.strip():
                    items = line.strip().split('|')
                    if len(items) > var_pos:
                        try:
                            timestamp = float(items[0])
                            if start <= timestamp <= end:
                                if i % frequency == 0:
                                    value = items[var_pos]
                                    if value != "null":
                                        try:
                                            result.append([timestamp * 1000, float(value)])
                                        except ValueError:
                                            pass
                                i += 1
                        except (ValueError, IndexError):
                            continue
    except FileNotFoundError:
        print("⚠️ Файл week_data не найден")
    except Exception as e:
        print(f"❌ Ошибка при чтении файла week_data: {e}")
    
    return result

def cleanOldDataFromFile(week_ago):
    """Удаляет записи старше указанного времени из файла"""
    try:
        # Читаем все строки
        with open(os.path.join(script_dir,"week_data"),'r') as f:
            lines = f.readlines()
        
        # Фильтруем старые записи
        new_lines = []
        removed_count = 0
        for line in lines:
            if line.strip():
                try:
                    timestamp = float(line.split('|')[0])
                    if timestamp >= week_ago:
                        new_lines.append(line)
                    else:
                        removed_count += 1
                except (ValueError, IndexError):
                    # Сохраняем строки с некорректным форматом
                    new_lines.append(line)
        
        # Записываем обратно
        with open(os.path.join(script_dir,"week_data"),'w') as f:
            f.writelines(new_lines)
        
        if removed_count > 0:
            print(f"🧹 Удалено {removed_count} старых записей из файла")
            
    except Exception as e:
        print(f"❌ Ошибка при очистке файла: {e}")

def loadWeekDataPage(page, page_size):
    """Загружает данные с пагинацией"""
    result = []
    try:
        with open(os.path.join(script_dir,"week_data"),'r') as f:
            lines = f.readlines()
            
        # Вычисляем диапазон для пагинации
        total_lines = len(lines)
        start_index = (page - 1) * page_size
        end_index = min(start_index + page_size, total_lines)
        
        # Читаем только нужные строки
        for i in range(start_index, end_index):
            line = lines[i].strip()
            if line:
                items = line.split('|')
                newline = []
                for j, item in enumerate(status_list):
                    if j < len(items):
                        if items[j] == "null":
                            newline.append(None)
                        else:
                            try:
                                value = float(items[j])
                                newline.append(value)
                            except ValueError:
                                newline.append(items[j])
                    else:
                        newline.append(None)
                result.append(newline)
        
        print(f"📄 Загружена страница {page}: записи {start_index}-{end_index} из {total_lines}")
        
    except FileNotFoundError:
        print("⚠️ Файл week_data не найден")
    except Exception as e:
        print(f"❌ Ошибка при загрузке страницы: {e}")
    
    return result

def loadWeekDataRange(start_time, end_time, max_records):
    """Загружает данные по диапазону времени"""
    result = []
    try:
        with open(os.path.join(script_dir,"week_data"),'r') as f:
            count = 0
            for line in f:
                if count >= max_records:
                    break
                    
                if line.strip():
                    items = line.strip().split('|')
                    if len(items) > 0:
                        try:
                            timestamp = float(items[0])
                            if start_time <= timestamp <= end_time:
                                newline = []
                                for j, item in enumerate(status_list):
                                    if j < len(items):
                                        if items[j] == "null":
                                            newline.append(None)
                                        else:
                                            try:
                                                value = float(items[j])
                                                newline.append(value)
                                            except ValueError:
                                                newline.append(items[j])
                                    else:
                                        newline.append(None)
                                result.append(newline)
                                count += 1
                        except (ValueError, IndexError):
                            continue
        
        print(f"📅 Загружен диапазон {start_time}-{end_time}: {len(result)} записей")
        
    except FileNotFoundError:
        print("⚠️ Файл week_data не найден")
    except Exception as e:
        print(f"❌ Ошибка при загрузке диапазона: {e}")
    
    return result

def loadLastRecord():
    """Загружает последнюю запись из файла для интеграции"""
    global last_record
    try:
        with open(os.path.join(script_dir,"week_data"),'r') as f:
            lines = f.readlines()
            if lines:
                last_line = lines[-1].strip()
                if last_line:
                    items = last_line.split('|')
                    newline = []
                    for i, item in enumerate(status_list):
                        if i < len(items):
                            if items[i] == "null":
                                newline.append(None)
                            else:
                                try:
                                    value = float(items[i])
                                    newline.append(value)
                                except ValueError:
                                    newline.append(items[i])
                        else:
                            newline.append(None)
                    last_record = newline
                    print(f"✅ Загружена последняя запись для интеграции")
    except Exception as e:
        print(f"❌ Ошибка при загрузке последней записи: {e}")
        last_record = None

# Функция writeWeekData больше не нужна - данные записываются напрямую в файл

# Функция getArrByVar перенесена в класс ServerRPC

def tick():
    readPv()
    saveData()
    weekCheck()
    checkMemoryUsage()  # Проверяем потребление памяти

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
            print(e)
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
# Глобальные переменные для оптимизированной работы
last_record = None  # Последняя запись для интеграции
recent_cache = []   # Кэш последних записей
prev_hour = "09"

# Заменяем PyQt4 на threading.Timer
def run_timer():
    while True:
        tick()
        time.sleep(1)

thread1 = threading.Thread(target=runserver)
thread1.start()
#thread2 = threading.Thread(target=runpublisher)
#thread2.start()

loadLastRecord()  # Загружаем только последнюю запись для интеграции

# Запускаем таймер в отдельном потоке
timer_thread = threading.Thread(target=run_timer, daemon=True)
timer_thread.start()

# Основной поток ждет завершения
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("Остановка сервера...")
    sys.exit(0)
