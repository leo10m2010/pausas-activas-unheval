# Conversión de Videos a WebM

La aplicación ahora soporta **múltiples formatos de video**: MP4, WebM y OGG.

## ✅ Formatos Soportados

- **MP4** (H.264) - Compatible, buena calidad
- **WebM** (VP9) - **Recomendado** - Mejor compresión, archivos más pequeños
- **OGG** (Theora) - Compatible, pero menos eficiente

## 🎥 Cómo Convertir Videos a WebM

### Opción 1: FFmpeg (Recomendado)

#### Instalación de FFmpeg
```bash
# Windows
winget install ffmpeg

# O descargar desde: https://ffmpeg.org/download.html
```

#### Conversión Individual
```bash
# Convertir un video MP4 a WebM (alta calidad, buen tamaño)
ffmpeg -i ejercicio1.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus -b:a 96k ejercicio1.webm

# Convertir con calidad personalizada
ffmpeg -i ejercicio1.mp4 -c:v libvpx-vp9 -crf 28 -b:v 0 -c:a libopus -b:a 128k ejercicio1.webm
```

#### Conversión por Lotes (Todos los videos)
```bash
# Windows CMD
for %f in (*.mp4) do ffmpeg -i "%f" -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus -b:a 96k "%~nf.webm"

# Windows PowerShell
Get-ChildItem *.mp4 | ForEach-Object { ffmpeg -i $_.FullName -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus -b:a 96k "$($_.BaseName).webm" }
```

### Opción 2: Herramientas Online

- **CloudConvert**: https://cloudconvert.com/mp4-to-webm
- **Online-Convert**: https://www.online-convert.com/es/convertir-a-webm
- **FreeConvert**: https://www.freeconvert.com/mp4-to-webm

### Opción 3: HandBrake (Interfaz Gráfica)

1. Descargar: https://handbrake.fr/
2. Abrir HandBrake
3. Seleccionar video fuente
4. En "Format" seleccionar "WebM"
5. Ajustar calidad (RF 28-32 recomendado)
6. Click en "Start Encode"

## 📊 Parámetros de FFmpeg Explicados

```bash
-c:v libvpx-vp9       # Codec de video VP9 (mejor que VP8)
-crf 30               # Calidad (18=excelente, 30=buena, 40=baja)
-b:v 0                # Bitrate variable (automático)
-c:a libopus          # Codec de audio Opus (mejor que Vorbis)
-b:a 96k              # Bitrate de audio (96k=bueno para voz)
```

### Niveles de Calidad (CRF)

| CRF | Calidad | Tamaño | Uso Recomendado |
|-----|---------|--------|-----------------|
| 20-25 | Excelente | Grande | Archivos importantes |
| 26-30 | Muy buena | Medio | **Recomendado para la app** |
| 31-35 | Buena | Pequeño | Aceptable |
| 36-40 | Aceptable | Muy pequeño | Solo si el tamaño es crítico |

## 🔄 Cómo Usar Videos WebM en la Aplicación

1. **Convertir tus videos a WebM** usando uno de los métodos anteriores
2. **Copiar los archivos .webm** a la carpeta `assets/videos/`
3. **Actualizar las rutas** en `src/renderer/src/App.tsx`:

```typescript
const defaultVideos = [
  {
    id: 1,
    title: 'Ejercicio 1 - Estiramiento de cuello',
    src: `${basePath}/videos/ejercicio1.webm`, // Cambiado a .webm
    subtitles: `${basePath}/subs/ejercicio1.vtt`
  },
  // ... más videos
]
```

4. **Compilar y distribuir**:
```bash
npm run build
npm run dist
```

## 📦 Ventajas de WebM

- ✅ **Tamaño más pequeño** (30-50% menos que MP4)
- ✅ **Código abierto** (sin royalties)
- ✅ **Excelente calidad** de video
- ✅ **Nativo en navegadores** modernos
- ✅ **Soportado 100%** en Electron/Chromium

## 🎯 Recomendación Final

**Para la mejor experiencia:**
- Usa **WebM con VP9** para videos largos (>1 minuto)
- Usa **MP4 con H.264** para compatibilidad universal
- CRF entre **28-30** para buen balance calidad/tamaño
- Audio **Opus a 96kbps** para voz

## 💡 Ejemplos Prácticos

### Video de 5 minutos
```bash
# Alta calidad (CRF 28) - ~8-12 MB
ffmpeg -i ejercicio.mp4 -c:v libvpx-vp9 -crf 28 -b:v 0 -c:a libopus -b:a 96k ejercicio.webm

# Calidad normal (CRF 32) - ~5-8 MB
ffmpeg -i ejercicio.mp4 -c:v libvpx-vp9 -crf 32 -b:v 0 -c:a libopus -b:a 96k ejercicio.webm
```

### Verificar información del video
```bash
ffmpeg -i ejercicio.webm
```

## ❓ Solución de Problemas

**Error: "libvpx-vp9 not found"**
- Reinstalar FFmpeg con soporte completo de codecs

**El video no se reproduce**
- Verificar que el archivo no esté corrupto
- Probar con un CRF más bajo (mejor calidad)

**El archivo es muy grande**
- Aumentar el CRF (30-35)
- Reducir el bitrate de audio a 64k
- Reducir la resolución: `-s 1280x720`

## 📞 Soporte

Si tienes problemas con la conversión, revisa:
- Documentación de FFmpeg: https://ffmpeg.org/documentation.html
- Wiki de WebM: https://www.webmproject.org/
