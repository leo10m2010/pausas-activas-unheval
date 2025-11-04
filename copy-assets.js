const fs = require('fs');
const path = require('path');

// Copiar recursivamente con manejo de errores
function copyRecursive(src, dest) {
  try {
    if (!fs.existsSync(src)) {
      console.warn(`⚠️  Origen no existe: ${src}`);
      return;
    }

    const stats = fs.statSync(src);

    if (stats.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      const files = fs.readdirSync(src);
      files.forEach(file => {
        // Ignorar archivos .md, .txt y otros innecesarios
        if (file.endsWith('.md') || file.endsWith('.txt') || file.startsWith('.')) return;
        copyRecursive(path.join(src, file), path.join(dest, file));
      });
    } else {
      // Solo copiar archivos válidos
      if (!dest.endsWith('.md') && !dest.endsWith('.txt')) {
        fs.copyFileSync(src, dest);
        console.log(`✓ Copiado: ${path.basename(dest)}`);
      }
    }
  } catch (error) {
    console.error(`✗ Error copiando ${src} a ${dest}:`, error.message);
    // No lanzar el error, continuar con otros archivos
  }
}

console.log('📦 Copiando assets a dist/renderer...');

try {
  // Copiar videos (soporta .mp4, .webm, .ogg y otros formatos)
  copyRecursive(
    path.join(__dirname, 'assets', 'videos'),
    path.join(__dirname, 'dist', 'renderer', 'videos')
  );

  // Copiar iconos
  copyRecursive(
    path.join(__dirname, 'assets', 'icons'),
    path.join(__dirname, 'dist', 'renderer', 'icons')
  );

  // Copiar subtítulos
  copyRecursive(
    path.join(__dirname, 'assets', 'subs'),
    path.join(__dirname, 'dist', 'renderer', 'subs')
  );

  console.log('✓ Assets copiados exitosamente!');
} catch (error) {
  console.error('✗ Error durante la copia de assets:', error.message);
  process.exit(1);
}
