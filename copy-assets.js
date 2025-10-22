const fs = require('fs');
const path = require('path');

// Copiar recursivamente
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`Origen no existe: ${src}`);
    return;
  }

  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    files.forEach(file => {
      // Ignorar archivos .md y otros innecesarios
      if (file.endsWith('.md') || file.endsWith('.txt')) return;
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    // Solo copiar si no es archivo .md
    if (!dest.endsWith('.md') && !dest.endsWith('.txt')) {
      fs.copyFileSync(src, dest);
      console.log(`Copiado: ${path.basename(dest)}`);
    }
  }
}

console.log('Copiando assets a dist/renderer...');

// Copiar videos
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

console.log('Assets copiados exitosamente!');
