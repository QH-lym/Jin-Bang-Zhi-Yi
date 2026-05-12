!include "FileFunc.nsh"
!include "LogicLib.nsh"

!define EXIT_APP_EXISTS 3
!define EXIT_DISK_FULL 5
!define EXIT_REBOOT_REQUIRED 9

!macro exitWithCode CODE MESSAGE
  ${IfNot} ${Silent}
    MessageBox MB_OK|MB_ICONEXCLAMATION "${MESSAGE}"
  ${EndIf}
  SetErrorLevel ${CODE}
  Quit
!macroend

!macro checkSameVersionInstalled ROOT_KEY
  ClearErrors
  ReadRegStr $R0 ${ROOT_KEY} "${UNINSTALL_REGISTRY_KEY}" "DisplayVersion"
  ${IfNot} ${Errors}
  ${AndIf} "$R0" == "${VERSION}"
    !insertmacro exitWithCode ${EXIT_APP_EXISTS} "晋梆智绎 ${VERSION} 已安装。"
  ${EndIf}
!macroend

!macro checkPendingReboot
  ClearErrors
  ReadRegStr $R0 HKLM "SYSTEM\CurrentControlSet\Control\Session Manager" "PendingFileRenameOperations"
  ${IfNot} ${Errors}
    !insertmacro exitWithCode ${EXIT_REBOOT_REQUIRED} "系统存在待重启任务，请重启 Windows 后再安装晋梆智绎。"
  ${EndIf}

  ClearErrors
  EnumRegValue $R0 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending" 0
  ${IfNot} ${Errors}
    !insertmacro exitWithCode ${EXIT_REBOOT_REQUIRED} "系统存在待重启任务，请重启 Windows 后再安装晋梆智绎。"
  ${EndIf}

  ClearErrors
  EnumRegValue $R0 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired" 0
  ${IfNot} ${Errors}
    !insertmacro exitWithCode ${EXIT_REBOOT_REQUIRED} "系统存在待重启任务，请重启 Windows 后再安装晋梆智绎。"
  ${EndIf}

  ClearErrors
  ReadRegDWORD $R0 HKLM "SOFTWARE\Microsoft\Updates" "UpdateExeVolatile"
  ${IfNot} ${Errors}
  ${AndIf} $R0 != 0
    !insertmacro exitWithCode ${EXIT_REBOOT_REQUIRED} "系统存在待重启任务，请重启 Windows 后再安装晋梆智绎。"
  ${EndIf}
!macroend

!macro checkDiskSpace
  StrCpy $R0 ${ESTIMATED_SIZE}
  IntOp $R0 $R0 + 102400
  ${GetRoot} "$INSTDIR" $R1
  ${DriveSpace} "$R1" "/D=F /S=K" $R2
  ${IfNot} ${Errors}
  ${AndIf} $R2 < $R0
    !insertmacro exitWithCode ${EXIT_DISK_FULL} "磁盘空间不足，请释放至少 100 MB 额外空间后再安装晋梆智绎。"
  ${EndIf}
!macroend

!macro customInit
  SetSilent silent
  !insertmacro checkSameVersionInstalled HKCU
  !insertmacro checkSameVersionInstalled HKLM
  !insertmacro checkPendingReboot
  !insertmacro checkDiskSpace
!macroend
