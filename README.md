# 💪 Pausas Activas UNHEVAL

Aplicación de escritorio para recordatorios de pausas activas - Universidad Nacional Hermilio Valdizán

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-UNHEVAL-green.svg)

## 📋 Características

- ✅ **Recordatorios automáticos** cada 2 horas (configurable)
- ✅ **Videos de ejercicios** incluidos
- ✅ **Actualizaciones automáticas** desde GitHub
- ✅ **Inicio automático** con Windows
- ✅ **Interfaz moderna** con colores institucionales UNHEVAL
- ✅ **Notificaciones del sistema** integradas

## 🚀 Instalación

### Para Usuarios Finales:

1. Ve a [Releases](../../releases)
2. Descarga el archivo `.exe` más reciente
3. Ejecuta el instalador
4. ¡Listo! La aplicación se iniciará automáticamente

### Para Desarrolladores:

```bash
# Clonar repositorio
git clone https://github.com/leo10m2010/pausas-activas-unheval.git
cd pausas-activas-unheval

# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Generar instalador
npm run dist
```

## 🔧 Tecnologías

- **Electron** 28.x - Framework de aplicaciones de escritorio
- **React** 18.x - UI
- **TypeScript** - Lenguaje
- **Vite** - Build tool
- **electron-updater** - Actualizaciones automáticas

## 📦 Estructura del Proyecto

```
pausas-activas-unheval/
├── src/
│   ├── main/          # Proceso principal de Electron
│   └── renderer/      # Interfaz React
├── assets/
│   ├── videos/        # Videos de ejercicios
│   └── icons/         # Iconos de la app
├── .github/
│   └── workflows/     # GitHub Actions
└── package.json
```

## 🔄 Actualizaciones Automáticas

La aplicación verifica automáticamente nuevas versiones en GitHub Releases.

Cuando hay una actualización:
1. Notifica al usuario
2. Descarga en segundo plano
3. Instala al cerrar la app

## 👥 Desarrollado para

**Universidad Nacional Hermilio Valdizán**  
Oficina de Comunicación e Imagen Institucional

## 📄 Licencia

© Universidad Nacional Hermilio Valdizán  
Uso interno institucional

## 🤝 Contribuir

Para reportar problemas o sugerir mejoras:
1. Crea un [Issue](../../issues)
2. Describe el problema detalladamente
3. Incluye capturas de pantalla si aplica

## 📞 Soporte

- **Web**: https://unheval.edu.pe
- **Email**: comunicaciones@unheval.edu.pe

---

**¡Recuerda hacer pausas activas regularmente!** 💪🏃‍♂️
