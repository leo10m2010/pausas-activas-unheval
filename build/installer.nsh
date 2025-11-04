; Script personalizado NSIS para Pausas Activas UNHEVAL
; Este archivo mejora la experiencia de instalación

!macro customInit
  ; Mostrar mensaje con la ubicación de instalación
  MessageBox MB_OK|MB_ICONINFORMATION "Pausas Activas UNHEVAL se instalará en:$\n$\n$INSTDIR$\n$\nSi deseas cambiar la ubicación, hazlo en la siguiente pantalla."
!macroend

!macro customInstall
  ; Crear archivo con la ubicación de instalación
  FileOpen $0 "$INSTDIR\UBICACION-INSTALACION.txt" w
  FileWrite $0 "Pausas Activas UNHEVAL está instalado en:$\r$\n"
  FileWrite $0 "$INSTDIR$\r$\n$\r$\n"
  FileWrite $0 "Para desinstalar:$\r$\n"
  FileWrite $0 "1. Panel de Control > Programas y características$\r$\n"
  FileWrite $0 "2. Buscar 'Pausas Activas UNHEVAL'$\r$\n"
  FileWrite $0 "3. Clic derecho > Desinstalar$\r$\n$\r$\n"
  FileWrite $0 "O ejecuta: Uninstall Pausas Activas UNHEVAL.exe$\r$\n$\r$\n"
  FileWrite $0 "Universidad Nacional Hermilio Valdizán$\r$\n"
  FileWrite $0 "https://unheval.edu.pe"
  FileClose $0

  ; Copiar script de desinstalación manual al escritorio (opcional)
  ; IfFileExists "$INSTDIR\DESINSTALAR-MANUAL.bat" 0 +2
  ; CopyFiles "$INSTDIR\DESINSTALAR-MANUAL.bat" "$DESKTOP\Desinstalar Pausas Activas.bat"
!macroend

!macro customUnInstall
  ; Eliminar archivo de ubicación
  Delete "$INSTDIR\UBICACION-INSTALACION.txt"

  ; Eliminar accesos directos adicionales
  Delete "$DESKTOP\Desinstalar Pausas Activas.bat"
!macroend

!macro customInstallMode
  ; Mensaje informativo sobre la instalación
  ; MessageBox MB_OK "Pausas Activas UNHEVAL se instalará para el usuario actual.$\n$\nSi necesitas instalarlo para todos los usuarios del equipo, contacta al administrador de TI."
!macroend
