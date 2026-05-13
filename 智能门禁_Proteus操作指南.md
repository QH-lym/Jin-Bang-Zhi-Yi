# 智能门禁系统 - Proteus 仿真操作指南

## 一、元器件清单（已加载到库中）

左侧 DEVICES 面板中已有以下元器件：

| 序号 | 元器件名称 | 用途 |
|------|-----------|------|
| 1 | 1N4007 | 续流二极管 |
| 2 | ARDUINO UNO V3 | 主控板 |
| 3 | BUTTON | 按钮（2个） |
| 4 | BUZZER | 蜂鸣器 |
| 5 | LED-GREEN | 绿灯（授权指示） |
| 6 | LED-RED | 红灯（拒绝指示） |
| 7 | LED-YELLOW | 黄灯（门锁仿真） |
| 8 | RELAY | 继电器 |
| 9 | RES | 电阻（3个） |
| 10 | SW-SPST | 开关（2个） |

> **注意**：还需要手动添加 DIPSW_3（3位拨码开关）和 VIRTUAL TERMINAL（3个虚拟终端）

---

## 二、放置元器件步骤

### 步骤1：放置 Arduino UNO（主控）
1. 在左侧 DEVICES 列表中找到 **ARDUINO UNO V3**
2. 点击选中它
3. 在画布中央区域单击鼠标左键放置
4. 按键盘 **Esc** 键退出放置模式

### 步骤2：放置开关和按钮（左侧）
按顺序放置以下元器件到画布左侧：

| 元器件 | 位置建议 | 用途 |
|--------|---------|------|
| SW-SPST (x2) | 左侧偏上 | 门磁开关、红外检测 |
| BUTTON (x2) | 左侧中部 | 授权卡、未授权卡模拟 |

**操作方法**：
1. 在 DEVICES 列表中点击元器件名称
2. 在画布目标位置单击放置
3. 按 **Esc** 退出
4. 重复放置第二个同类元器件

### 步骤3：放置模式选择开关
需要添加 DIPSW_3：
1. 按键盘 **P** 键打开 Pick Devices 对话框
2. 输入 **DIPSW_3** 搜索
3. 选择后点击 **OK**
4. 在画布左侧放置

### 步骤4：放置指示器件（右侧）
按顺序放置：

| 元器件 | 位置建议 |
|--------|---------|
| LED-GREEN | 右侧上部 |
| LED-RED | 右侧上部（绿灯下方） |
| RES (x2) | 放在两个 LED 左侧 |
| BUZZER | 右侧中部 |

### 步骤5：放置继电器驱动电路
按顺序放置：

| 元器件 | 位置建议 |
|--------|---------|
| RES | Arduino D8 附近 |
| 2N2222 或 NPN 三极管 | 电阻右侧 |
| RELAY | 三极管右侧 |
| 1N4007 | 继电器线圈旁 |
| LED-YELLOW | 继电器右侧（作为门锁负载） |

### 步骤6：放置虚拟终端（底部）
需要添加 3 个 VIRTUAL TERMINAL：
1. 按 **P** 键打开 Pick Devices
2. 输入 **VIRTUAL TERMINAL** 搜索
3. 放置 3 个到画布底部，分别命名为：
   - ZIGBEE_TERM
   - IPV6_TERM
   - BT_TERM

---

## 三、连线步骤

### 连线1：开关输入（使用 INPUT_PULLUP）
所有开关一端接 Arduino 引脚，另一端接 GND：

```
SW1 一端 → Arduino D2
SW1 另一端 → GND

SW2 一端 → Arduino D3
SW2 另一端 → GND

BUTTON1 一端 → Arduino D4（授权卡）
BUTTON1 另一端 → GND

BUTTON2 一端 → Arduino D5（未授权卡）
BUTTON2 另一端 → GND
```

### 连线2：模式选择开关
```
DIPSW_3 Bit1 → Arduino A0
DIPSW_3 Bit2 → Arduino A1
DIPSW_3 Bit3 → Arduino A2
DIPSW_3 公共端 → GND
```

### 连线3：绿灯指示电路
```
Arduino D10 → RES1 一端
RES1 另一端 → LED-GREEN 正极（长脚）
LED-GREEN 负极 → GND
```

### 连线4：红灯指示电路
```
Arduino D11 → RES2 一端
RES2 另一端 → LED-RED 正极
LED-RED 负极 → GND
```

### 连线5：蜂鸣器
```
Arduino D9 → BUZZER 正极
BUZZER 负极 → GND
```

### 连线6：继电器驱动（重要！）
```
Arduino D8 → RES3 一端
RES3 另一端 → 三极管 Base（基极）
三极管 Emitter（发射极）→ GND
三极管 Collector（集电极）→ RELAY 线圈负极
RELAY 线圈正极 → +5V
```

### 连线7：续流二极管（保护电路）
```
1N4007 阴极（带线端）→ +5V
1N4007 阳极 → 三极管 Collector（即继电器线圈负极）
```
> 作用：防止继电器线圈断电时产生反向电动势损坏三极管

### 连线8：门锁仿真
```
+5V → RELAY COM（公共端）
RELAY NO（常开）→ LED-YELLOW 正极
LED-YELLOW 负极 → GND
```

### 连线9：通信终端
```
Arduino TX (D1) → VIRTUAL TERMINAL 1 RX
Arduino TX (D1) → VIRTUAL TERMINAL 2 RX
Arduino TX (D1) → VIRTUAL TERMINAL 3 RX

所有 VIRTUAL TERMINAL GND → GND
```

### 连线10：电源
```
Arduino 5V → 所有需要 +5V 的地方
Arduino GND → 所有需要 GND 的地方
```

---

## 四、快速连线技巧

1. **自动连线**：鼠标移到引脚，出现绿色方块时点击并拖动到目标引脚
2. **绘制总线**：对于多个 GND 或 +5V 连接，可以先画一条总线
3. **网络标签**：使用网络标签（Net Label）可以简化连线，相同标签的引脚视为连接
4. **复制连线**：选中已画好的线，按 Ctrl+C / Ctrl+V 复制

---

## 五、验证检查清单

放置和连线完成后，请检查：

- [ ] Arduino UNO 已放置在中央
- [ ] 4个开关/按钮在左侧，分别接 D2/D3/D4/D5
- [ ] DIPSW_3 在左侧，接 A0/A1/A2
- [ ] 2个 LED 在右侧，分别通过电阻接 D10/D11
- [ ] BUZZER 接 D9
- [ ] 继电器驱动电路完整（三极管、电阻、二极管）
- [ ] 3个 VIRTUAL TERMINAL 在底部，都接 TX
- [ ] 所有 GND 已连接
- [ ] 所有 +5V 已连接
- [ ] 续流二极管方向正确（阴极接 +5V）

---

## 六、下一步操作

1. 编译 Arduino 程序生成 .hex 文件
2. 双击 Arduino，在 Program File 中加载 .hex
3. 点击运行仿真按钮（底部播放图标）
4. 测试各种开关组合，观察 LED 和虚拟终端输出
