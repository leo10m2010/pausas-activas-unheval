const fs = require('fs');
const { execSync } = require('child_process');

// Script para generar un icono .ico válido desde un PNG

console.log('🎨 Generando icono .ico desde PNG...');

try {
  // Verificar que el PNG existe
  if (!fs.existsSync('build/icons/icon.png')) {
    throw new Error('El archivo build/icons/icon.png no existe');
  }

  // Instalar sharp temporalmente si no está instalado
  console.log('📦 Verificando dependencias...');
  try {
    require.resolve('sharp');
  } catch (e) {
    console.log('📦 Instalando sharp...');
    execSync('npm install sharp --no-save', { stdio: 'inherit' });
  }

  // Instalar to-ico temporalmente si no está instalado
  try {
    require.resolve('to-ico');
  } catch (e) {
    console.log('📦 Instalando to-ico...');
    execSync('npm install to-ico --no-save', { stdio: 'inherit' });
  }

  const sharp = require('sharp');
  const toIco = require('to-ico');

  // Paths
  const inputPng = 'build/icons/icon.png';
  const outputIco = 'build/icons/icon.ico';

  console.log('🔄 Procesando imagen...');

  // Función async para manejar todo el proceso
  (async () => {
    try {
      // Crear múltiples versiones del icono en diferentes tamaños
      const sizes = [256, 128, 64, 48, 32, 16];
      const buffers = [];

      for (const size of sizes) {
        console.log(`  - Generando ${size}x${size}...`);
        const buffer = await sharp(inputPng)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toBuffer();
        buffers.push(buffer);
      }

      console.log('🔄 Convirtiendo a formato ICO...');

      // Convertir todos los buffers a ICO
      const icoBuffer = await toIco(buffers);

      // Guardar el archivo ICO
      fs.writeFileSync(outputIco, icoBuffer);

      // Verificar el archivo generado
      const stats = fs.statSync(outputIco);
      console.log(`✅ Icono generado exitosamente: build/icons/icon.ico`);
      console.log(`📊 Tamaño del archivo: ${(stats.size / 1024).toFixed(2)} KB`);

      if (stats.size < 1000) {
        console.warn('⚠️  Advertencia: El archivo ICO parece muy pequeño');
      } else {
        console.log('✅ ¡Todo listo! El icono está disponible para usarse.');
      }

    } catch (error) {
      console.error('❌ Error durante la conversión:', error.message);
      process.exit(1);
    }
  })();

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
