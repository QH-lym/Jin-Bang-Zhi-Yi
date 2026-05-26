# -*- coding: utf-8 -*-
"""
智能门窗安全监控系统 - Web 版本
功能：数据帧解析、门磁/红外状态显示、告警判定、趋势图和运行日志。
运行环境：Python 3.9+；依赖：flask
安装命令：pip install flask
访问地址：http://localhost:5000
"""
import datetime
import random
import json
from collections import deque
from flask import Flask, render_template_string, jsonify

app = Flask(__name__)

# 全局状态
class MonitorState:
    def __init__(self):
        self.door_closed = True
        self.ir_triggered = False
        self.alarm_history = deque(maxlen=60)
        self.time_history = deque(maxlen=60)
        self.logs = deque(maxlen=100)
        self.student_name = "__________"
        self.student_id = "__________"
        self.mode = "ZigBee"
        self.raw_frame = "等待数据..."
        
    def judge_alarm(self):
        if (not self.door_closed) and self.ir_triggered:
            return '非法入侵告警', 1
        if (not self.door_closed) and (not self.ir_triggered):
            return '门窗打开提醒', 1
        if self.door_closed and self.ir_triggered:
            return '门窗附近有人靠近', 1
        return '正常', 0
    
    def add_log(self, msg):
        now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_entry = f'[{now}] {msg}'
        self.logs.append(log_entry)
        return log_entry

state = MonitorState()

HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>智能门窗安全监控系统</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Microsoft YaHei', sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
            min-height: 100vh;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h1 {
            font-size: 28px;
            color: #00d4ff;
            text-shadow: 0 0 10px rgba(0,212,255,0.5);
        }
        .controls {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        .controls input, .controls select {
            padding: 8px 12px;
            border: 1px solid #00d4ff;
            background: rgba(0,212,255,0.1);
            color: #fff;
            border-radius: 5px;
        }
        .controls button {
            padding: 8px 20px;
            background: linear-gradient(45deg, #00d4ff, #0099cc);
            border: none;
            color: #fff;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
        }
        .controls button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(0,212,255,0.4);
        }
        .cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .card {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(0,212,255,0.3);
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            transition: all 0.3s;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,212,255,0.2);
        }
        .card h3 {
            color: #888;
            font-size: 14px;
            margin-bottom: 10px;
        }
        .card .value {
            font-size: 24px;
            font-weight: bold;
        }
        .card.door .value { color: #00ff88; }
        .card.ir .value { color: #ffaa00; }
        .card.alarm .value { color: #ff4444; }
        .card.status .value { color: #00d4ff; }
        .main-content {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
        }
        .chart-container {
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            padding: 20px;
        }
        .log-container {
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            padding: 20px;
            max-height: 400px;
            overflow-y: auto;
        }
        .log-container h3 {
            color: #00d4ff;
            margin-bottom: 10px;
        }
        .log-entry {
            padding: 5px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            font-size: 12px;
            font-family: monospace;
        }
        .raw-frame {
            background: rgba(0,0,0,0.3);
            padding: 10px;
            border-radius: 5px;
            margin-top: 20px;
            font-family: monospace;
            font-size: 12px;
            color: #00ff88;
        }
        @media (max-width: 768px) {
            .main-content { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏠 智能门窗安全监控系统</h1>
    </div>
    
    <div class="controls">
        <input type="text" id="studentName" placeholder="姓名" value="__________">
        <input type="text" id="studentId" placeholder="学号" value="__________">
        <select id="mode">
            <option value="ZigBee">ZigBee</option>
            <option value="IPv6">IPv6</option>
            <option value="Bluetooth">Bluetooth</option>
        </select>
        <button onclick="startMonitor()">▶ 开始监控</button>
        <button onclick="stopMonitor()">⏹ 停止</button>
        <button onclick="demoData()">🎲 模拟数据</button>
    </div>
    
    <div class="cards">
        <div class="card door">
            <h3>🚪 门磁状态</h3>
            <div class="value" id="doorStatus">--</div>
        </div>
        <div class="card ir">
            <h3>👁 红外状态</h3>
            <div class="value" id="irStatus">--</div>
        </div>
        <div class="card alarm">
            <h3>⚠️ 告警等级</h3>
            <div class="value" id="alarmStatus">--</div>
        </div>
        <div class="card status">
            <h3>📡 通信状态</h3>
            <div class="value" id="commStatus">待机</div>
        </div>
    </div>
    
    <div class="main-content">
        <div class="chart-container">
            <canvas id="trendChart"></canvas>
        </div>
        <div class="log-container">
            <h3>📝 运行日志</h3>
            <div id="logList"></div>
        </div>
    </div>
    
    <div class="raw-frame" id="rawFrame">等待数据...</div>
    
    <script>
        let monitoring = false;
        let chart;
        let updateInterval;
        
        // 初始化图表
        const ctx = document.getElementById('trendChart').getContext('2d');
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '告警状态 (1=异常, 0=正常)',
                    data: [],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0,212,255,0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#00d4ff',
                    pointRadius: 4,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: '#fff' } },
                    title: {
                        display: true,
                        text: '告警状态趋势图',
                        color: '#fff',
                        font: { size: 16 }
                    }
                },
                scales: {
                    y: {
                        min: -0.1,
                        max: 1.2,
                        ticks: { color: '#888' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    x: {
                        ticks: { color: '#888' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
        
        function updateDisplay(data) {
            document.getElementById('doorStatus').textContent = data.door_status;
            document.getElementById('irStatus').textContent = data.ir_status;
            document.getElementById('alarmStatus').textContent = data.alarm_status;
            document.getElementById('commStatus').textContent = data.comm_status;
            document.getElementById('rawFrame').textContent = data.raw_frame;
            
            // 更新图表
            chart.data.labels = data.chart_labels;
            chart.data.datasets[0].data = data.chart_data;
            chart.update('none');
            
            // 更新日志
            const logList = document.getElementById('logList');
            logList.innerHTML = data.logs.map(log => 
                `<div class="log-entry">${log}</div>`
            ).join('');
            logList.scrollTop = logList.scrollHeight;
        }
        
        function startMonitor() {
            if (monitoring) return;
            monitoring = true;
            document.getElementById('commStatus').textContent = '监控中...';
            
            updateInterval = setInterval(() => {
                fetch('/api/status')
                    .then(r => r.json())
                    .then(data => updateDisplay(data));
            }, 1000);
        }
        
        function stopMonitor() {
            monitoring = false;
            clearInterval(updateInterval);
            document.getElementById('commStatus').textContent = '已停止';
        }
        
        function demoData() {
            fetch('/api/demo', { method: 'POST' })
                .then(r => r.json())
                .then(data => updateDisplay(data));
        }
        
        // 初始加载
        fetch('/api/status')
            .then(r => r.json())
            .then(data => updateDisplay(data));
    </script>
</body>
</html>
'''

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/status')
def get_status():
    alarm_text, alarm_value = state.judge_alarm()
    
    return jsonify({
        'door_status': '关闭/有磁场' if state.door_closed else '打开/无磁场',
        'ir_status': '触发/有障碍' if state.ir_triggered else '未触发/无障碍',
        'alarm_status': alarm_text,
        'comm_status': f'{state.mode} 监控中' if len(state.alarm_history) > 0 else '待机',
        'raw_frame': state.raw_frame,
        'chart_labels': list(state.time_history),
        'chart_data': list(state.alarm_history),
        'logs': list(state.logs)
    })

@app.route('/api/demo', methods=['POST'])
def demo_data():
    # 模拟传感器数据
    sensor_type = random.choice([0x01, 0x04])  # 门磁或红外
    value = random.choice([0, 1])
    
    frame = [0xEE, 0xCC, sensor_type, 0x01, 0x01, 0, 0, 0, 0, 0, value, 0, 0, 0xFF]
    raw = ' '.join(f'{b:02X}' for b in frame)
    state.raw_frame = f'最新原始帧：{raw}    NodeID=01'
    
    if sensor_type == 0x01:  # 门磁
        state.door_closed = bool(value)
        desc = '磁检测传感器：门窗关闭' if value else '磁检测传感器：门窗打开'
    else:  # 红外
        state.ir_triggered = bool(value)
        desc = '红外反射传感器：有障碍/有人靠近' if value else '红外反射传感器：无障碍'
    
    alarm_text, alarm_value = state.judge_alarm()
    state.alarm_history.append(alarm_value)
    state.time_history.append(datetime.datetime.now().strftime('%H:%M:%S'))
    state.add_log(f'{state.mode}  {desc}')
    
    return get_status()

if __name__ == '__main__':
    print('=' * 50)
    print('智能门窗安全监控系统 - Web 版本')
    print('=' * 50)
    print('访问地址: http://localhost:5000')
    print('按 Ctrl+C 停止服务')
    print('=' * 50)
    app.run(host='0.0.0.0', port=5000, debug=False)
