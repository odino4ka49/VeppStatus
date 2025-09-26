#!/usr/bin/env python3
"""
Альтернативная версия сервера сбора данных без EPICS
Используется для тестирования когда EPICS недоступен
"""

import time
import json
import os
import threading
import zerorpc
import random
from datetime import datetime

class MockServerRPC(object):
    """Мок-сервер для тестирования без EPICS"""
    
    def __init__(self):
        self.week_data_arr = []
        self.curshot = self._generate_mock_data()
        self._generate_historical_data()
    
    def _generate_mock_data(self):
        """Генерирует моковые данные для тестирования"""
        return {
            "time": time.time(),
            "V3_status": "collision",
            "V3_status_int": 3,
            "V3_time": 3600,
            "V3_mode": "collision",
            "V3_polarity": "e-",
            "V3_energy": 2100,
            "V3_total": 150.5,
            "V3_sep1": 75.2,
            "V3_sep2": 75.3,
            "V3_lifetime": 100000,
            "V3_currintegral": 150.5,
            "V4_status": "collision",
            "V4_status_int": 1,
            "V4_mode": "collision",
            "V4_polarity": "e-",
            "V4_energyset": 6500,
            "V4_energymeas": 6400,
            "V4_energy": 6400,
            "V4_total": 100.2,
            "V4_e1": 50.1,
            "V4_e2": 50.1,
            "V4_p1": 25.0,
            "V4_p2": 25.0,
            "V4_lifetime": 100000,
            "V4_luminosityE": 5000,
            "V4_luminosityP": 5000,
            "V4_luminosityMean": 5000,
            "V4_currintegral": 100.2,
            "V4_lumintegral": 5000
        }
    
    def _generate_historical_data(self):
        """Генерирует исторические данные для тестирования"""
        current_time = time.time()
        for i in range(1000):  # 1000 точек данных
            timestamp = current_time - (1000 - i) * 60  # Каждую минуту
            data_point = self._generate_mock_data()
            data_point["time"] = timestamp
            # Добавляем небольшие случайные изменения
            data_point["V3_total"] += random.uniform(-5, 5)
            data_point["V4_total"] += random.uniform(-2, 2)
            data_point["V4_luminosityE"] += random.uniform(-100, 100)
            data_point["V4_luminosityP"] += random.uniform(-100, 100)
            self.week_data_arr.append(list(data_point.values()))
    
    def getWeekDataArray(self):
        """Возвращает массив недельных данных"""
        return self.week_data_arr
    
    def getArrByVar(self, variable, start, end, frequency):
        """Возвращает данные по переменной за период"""
        result = []
        var_pos = self._get_variable_position(variable)
        
        if var_pos is None:
            return result
        
        for i, shot in enumerate(self.week_data_arr):
            if i % frequency == 0:
                if start <= shot[0] <= end:
                    result.append([shot[0] * 1000, shot[var_pos]])
        
        return result
    
    def getTick(self):
        """Возвращает текущие данные"""
        # Обновляем данные с небольшими изменениями
        self.curshot["time"] = time.time()
        self.curshot["V3_total"] += random.uniform(-1, 1)
        self.curshot["V4_total"] += random.uniform(-0.5, 0.5)
        self.curshot["V4_luminosityE"] += random.uniform(-10, 10)
        self.curshot["V4_luminosityP"] += random.uniform(-10, 10)
        
        return self.curshot
    
    def _get_variable_position(self, variable):
        """Возвращает позицию переменной в массиве данных"""
        variables = [
            "time", "V3_status", "V3_status_int", "V3_time", "V3_mode", "V3_polarity",
            "V3_energy", "V3_total", "V3_total_e-", "V3_total_e+", "V3_sep1", "V3_sep2",
            "V3_lifetime", "V3_currintegral", "V4_status", "V4_status_int", "V4_mode",
            "V4_polarity", "V4_energyset", "V4_energymeas", "V4_energy", "V4_total",
            "V4_e1", "V4_e2", "V4_p1", "V4_p2", "V4_lifetime", "V4_luminosityE",
            "V4_luminosityP", "V4_luminosityMean", "V4_currintegral", "V4_lumintegral"
        ]
        
        try:
            return variables.index(variable)
        except ValueError:
            return None

def run_mock_server():
    """Запускает мок-сервер"""
    print("🚀 Запуск мок-сервера сбора данных (без EPICS)...")
    print("📊 Сервер будет предоставлять тестовые данные")
    print("🌐 RPC сервер: tcp://127.0.0.1:4242")
    print("⏹️  Для остановки нажмите Ctrl+C")
    
    server = zerorpc.Server(MockServerRPC())
    server.bind("tcp://0.0.0.0:4242")
    server.run()

if __name__ == "__main__":
    run_mock_server()



