"""
状态与 EXE 返回 URL 配置管理模块
支持动态 URL 生成和多状态管理
支持 exitCode 与状态映射
"""

from typing import Dict, Optional, Callable, Any
from dataclasses import dataclass
from enum import Enum


class ExitCode(Enum):
    """
    EXE 退出码枚举
    常见的安装程序退出码
    """
    SUCCESS = 0                    # 成功
    SUCCESS_REBOOT = 1641          # 成功，需要重启
    SUCCESS_REBOOT_REQUIRED = 3010 # 成功，需要重启
    CANCELLED = 1602               # 用户取消安装
    FATAL_ERROR = 1603             # 致命错误
    NOT_INSTALLED = 1605           # 产品未安装
    ALREADY_RUNNING = 1618         # 另一个安装正在进行
    INVALID_PARAMETER = 87         # 参数无效
    ACCESS_DENIED = 5              # 访问被拒绝
    FILE_NOT_FOUND = 2             # 文件未找到
    TIMEOUT = 258                  # 操作超时
    NETWORK_ERROR = 12029          # 网络连接错误
    DISK_FULL = 112                # 磁盘空间不足
    REBOOT_REQUIRED = 3010         # 需要重启


class StatusCode(Enum):
    """业务状态枚举"""
    SUCCESS = "success"           # 成功
    CANCELLED = "cancelled"       # 已取消
    FAILED = "failed"             # 失败
    PENDING = "pending"           # 待处理
    PROCESSING = "processing"     # 处理中
    TIMEOUT = "timeout"           # 超时
    REBOOT_REQUIRED = "reboot_required"  # 需要重启
    ERROR = "error"               # 错误


# ExitCode 到 StatusCode 的映射
EXIT_CODE_TO_STATUS: Dict[int, StatusCode] = {
    ExitCode.SUCCESS.value: StatusCode.SUCCESS,
    ExitCode.SUCCESS_REBOOT.value: StatusCode.REBOOT_REQUIRED,
    ExitCode.SUCCESS_REBOOT_REQUIRED.value: StatusCode.REBOOT_REQUIRED,
    ExitCode.CANCELLED.value: StatusCode.CANCELLED,
    ExitCode.FATAL_ERROR.value: StatusCode.FAILED,
    ExitCode.NOT_INSTALLED.value: StatusCode.ERROR,
    ExitCode.ALREADY_RUNNING.value: StatusCode.PENDING,
    ExitCode.INVALID_PARAMETER.value: StatusCode.ERROR,
    ExitCode.ACCESS_DENIED.value: StatusCode.ERROR,
    ExitCode.FILE_NOT_FOUND.value: StatusCode.ERROR,
    ExitCode.TIMEOUT.value: StatusCode.TIMEOUT,
    ExitCode.NETWORK_ERROR.value: StatusCode.FAILED,
    ExitCode.DISK_FULL.value: StatusCode.FAILED,
    ExitCode.REBOOT_REQUIRED.value: StatusCode.REBOOT_REQUIRED,
}


@dataclass
class ExitCodeConfig:
    """ExitCode 配置类"""
    exit_code: int
    status: StatusCode
    url_template: str
    description: str
    return_content: Optional[str] = None  # 可选的返回内容


class ExitCodeURLManager:
    """
    ExitCode URL 管理器
    为每个 exitCode 提供独立的返回 URL 或内容
    """
    
    def __init__(self, base_url: str = "https://api.example.com"):
        self.base_url = base_url.rstrip('/')
        self._configs: Dict[int, ExitCodeConfig] = {}
        self._url_generators: Dict[int, Callable] = {}
        self._init_default_configs()
    
    def _init_default_configs(self):
        """初始化默认 ExitCode 配置"""
        default_configs = [
            # 成功状态
            ExitCodeConfig(
                exit_code=ExitCode.SUCCESS.value,
                status=StatusCode.SUCCESS,
                url_template="{base_url}/exe/callback/success",
                description="安装成功",
                return_content='{"status": "success", "exitCode": 0, "message": "安装成功完成"}'
            ),
            ExitCodeConfig(
                exit_code=ExitCode.SUCCESS_REBOOT.value,
                status=StatusCode.REBOOT_REQUIRED,
                url_template="{base_url}/exe/callback/success?reboot=required",
                description="安装成功，需要重启",
                return_content='{"status": "success", "exitCode": 1641, "message": "安装成功，需要重启系统"}'
            ),
            ExitCodeConfig(
                exit_code=ExitCode.SUCCESS_REBOOT_REQUIRED.value,
                status=StatusCode.REBOOT_REQUIRED,
                url_template="{base_url}/exe/callback/success?reboot=required",
                description="安装成功，需要重启",
                return_content='{"status": "success", "exitCode": 3010, "message": "安装成功，需要重启系统"}'
            ),
            
            # 取消状态
            ExitCodeConfig(
                exit_code=ExitCode.CANCELLED.value,
                status=StatusCode.CANCELLED,
                url_template="{base_url}/exe/callback/cancelled",
                description="用户取消安装",
                return_content='{"status": "cancelled", "exitCode": 1602, "message": "用户取消了安装操作"}'
            ),
            
            # 失败状态
            ExitCodeConfig(
                exit_code=ExitCode.FATAL_ERROR.value,
                status=StatusCode.FAILED,
                url_template="{base_url}/exe/callback/failed?error=fatal",
                description="安装遇到致命错误",
                return_content='{"status": "failed", "exitCode": 1603, "message": "安装过程中发生致命错误"}'
            ),
            ExitCodeConfig(
                exit_code=ExitCode.NETWORK_ERROR.value,
                status=StatusCode.FAILED,
                url_template="{base_url}/exe/callback/failed?error=network",
                description="网络连接错误",
                return_content='{"status": "failed", "exitCode": 12029, "message": "网络连接失败"}'
            ),
            ExitCodeConfig(
                exit_code=ExitCode.DISK_FULL.value,
                status=StatusCode.FAILED,
                url_template="{base_url}/exe/callback/failed?error=disk_full",
                description="磁盘空间不足",
                return_content='{"status": "failed", "exitCode": 112, "message": "磁盘空间不足，无法完成安装"}'
            ),
            
            # 错误状态
            ExitCodeConfig(
                exit_code=ExitCode.NOT_INSTALLED.value,
                status=StatusCode.ERROR,
                url_template="{base_url}/exe/callback/error?code=1605",
                description="产品未安装",
                return_content='{"status": "error", "exitCode": 1605, "message": "指定的产品未安装"}'
            ),
            ExitCodeConfig(
                exit_code=ExitCode.INVALID_PARAMETER.value,
                status=StatusCode.ERROR,
                url_template="{base_url}/exe/callback/error?code=87",
                description="参数无效",
                return_content='{"status": "error", "exitCode": 87, "message": "提供的参数无效"}'
            ),
            ExitCodeConfig(
                exit_code=ExitCode.ACCESS_DENIED.value,
                status=StatusCode.ERROR,
                url_template="{base_url}/exe/callback/error?code=5",
                description="访问被拒绝",
                return_content='{"status": "error", "exitCode": 5, "message": "权限不足，访问被拒绝"}'
            ),
            ExitCodeConfig(
                exit_code=ExitCode.FILE_NOT_FOUND.value,
                status=StatusCode.ERROR,
                url_template="{base_url}/exe/callback/error?code=2",
                description="文件未找到",
                return_content='{"status": "error", "exitCode": 2, "message": "指定的文件不存在"}'
            ),
            
            # 待处理状态
            ExitCodeConfig(
                exit_code=ExitCode.ALREADY_RUNNING.value,
                status=StatusCode.PENDING,
                url_template="{base_url}/exe/callback/pending?reason=already_running",
                description="另一个安装正在进行",
                return_content='{"status": "pending", "exitCode": 1618, "message": "另一个安装程序正在运行，请稍后重试"}'
            ),
            
            # 超时状态
            ExitCodeConfig(
                exit_code=ExitCode.TIMEOUT.value,
                status=StatusCode.TIMEOUT,
                url_template="{base_url}/exe/callback/timeout",
                description="操作超时",
                return_content='{"status": "timeout", "exitCode": 258, "message": "安装操作超时"}'
            ),
        ]
        
        for config in default_configs:
            self.register_exit_code(config)
    
    def register_exit_code(self, config: ExitCodeConfig):
        """注册 ExitCode 配置"""
        self._configs[config.exit_code] = config
    
    def register_url_generator(self, exit_code: int, generator: Callable):
        """注册自定义 URL 生成器"""
        self._url_generators[exit_code] = generator
    
    def get_url(self, exit_code: int, **kwargs) -> str:
        """
        获取指定 exitCode 的返回 URL
        
        Args:
            exit_code: 退出码
            **kwargs: URL 模板所需的参数
            
        Returns:
            生成的完整 URL
        """
        # 检查是否有自定义生成器
        if exit_code in self._url_generators:
            return self._url_generators[exit_code](**kwargs)
        
        # 使用模板生成
        if exit_code not in self._configs:
            # 未知退出码，返回默认错误 URL
            return f"{self.base_url}/exe/callback/unknown?exitCode={exit_code}"
        
        config = self._configs[exit_code]
        
        # 构建参数字典
        params = {"base_url": self.base_url, "exit_code": exit_code}
        params.update(kwargs)
        
        # 生成 URL
        url = config.url_template.format(**params)
        return url
    
    def get_return_content(self, exit_code: int, **kwargs) -> str:
        """
        获取指定 exitCode 的返回内容
        
        Args:
            exit_code: 退出码
            **kwargs: 内容模板所需的参数
            
        Returns:
            返回内容（JSON 格式）
        """
        if exit_code not in self._configs:
            return f'{{"status": "unknown", "exitCode": {exit_code}, "message": "未知的退出码"}}'
        
        config = self._configs[exit_code]
        
        if config.return_content:
            # 替换模板参数
            content = config.return_content
            for key, value in kwargs.items():
                content = content.replace(f"{{{key}}}", str(value))
            return content
        
        # 默认返回 JSON
        return f'{{"status": "{config.status.value}", "exitCode": {exit_code}, "message": "{config.description}"}}'
    
    def get_status(self, exit_code: int) -> StatusCode:
        """获取 exitCode 对应的状态"""
        if exit_code in self._configs:
            return self._configs[exit_code].status
        return StatusCode.ERROR
    
    def get_config(self, exit_code: int) -> Optional[ExitCodeConfig]:
        """获取 exitCode 配置"""
        return self._configs.get(exit_code)
    
    def get_all_exit_codes(self) -> Dict[int, Dict[str, Any]]:
        """获取所有 exitCode 配置"""
        return {
            code: {
                "status": config.status.value,
                "url": self.get_url(code),
                "description": config.description,
                "return_content": config.return_content
            }
            for code, config in self._configs.items()
        }
    
    def get_all_urls(self) -> Dict[int, str]:
        """获取所有 exitCode 对应的 URL"""
        return {code: self.get_url(code) for code in self._configs}


# 便捷函数
def get_exit_code_url(exit_code: int, base_url: str = "https://api.example.com") -> str:
    """快速获取 exitCode 对应的 URL"""
    manager = ExitCodeURLManager(base_url)
    return manager.get_url(exit_code)


def get_exit_code_content(exit_code: int, base_url: str = "https://api.example.com") -> str:
    """快速获取 exitCode 对应的返回内容"""
    manager = ExitCodeURLManager(base_url)
    return manager.get_return_content(exit_code)


def get_exit_code_status(exit_code: int) -> str:
    """快速获取 exitCode 对应的状态"""
    if exit_code in EXIT_CODE_TO_STATUS:
        return EXIT_CODE_TO_STATUS[exit_code].value
    return "unknown"


if __name__ == "__main__":
    # 使用示例
    manager = ExitCodeURLManager("https://myapp.example.com")
    
    print("=== ExitCode 状态映射 ===")
    for code, status in EXIT_CODE_TO_STATUS.items():
        print(f"ExitCode {code} -> {status.value}")
    
    print("\n=== 各 ExitCode 的 URL 和返回内容 ===")
    for exit_code in [0, 1602, 1603, 1641, 3010, 1618, 258]:
        config = manager.get_config(exit_code)
        if config:
            print(f"\nExitCode {exit_code}: {config.description}")
            print(f"  URL: {manager.get_url(exit_code)}")
            print(f"  返回内容: {manager.get_return_content(exit_code)}")
    
    print("\n\n=== 所有 ExitCode URL 映射 ===")
    all_urls = manager.get_all_urls()
    for code, url in sorted(all_urls.items()):
        print(f"ExitCode {code}: {url}")
