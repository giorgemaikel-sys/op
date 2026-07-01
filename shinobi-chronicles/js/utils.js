// Utilidades generales del juego

/**
 * Dibuja texto centrado en el canvas
 */
function drawCenteredText(ctx, text, x, y, fontSize = 20, color = '#ffffff', fontFamily = 'Arial') {
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
}

/**
 * Dibuja texto alineado a la izquierda
 */
function drawLeftText(ctx, text, x, y, fontSize = 20, color = '#ffffff', fontFamily = 'Arial') {
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
}

/**
 * Dibuja una barra de progreso (HP, Chakra, etc.)
 */
function drawBar(ctx, x, y, width, height, currentValue, maxValue, color1, color2, label = '') {
    // Fondo de la barra
    ctx.fillStyle = '#333333';
    ctx.fillRect(x, y, width, height);
    
    // Borde
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // Relleno
    const percentage = Math.max(0, Math.min(1, currentValue / maxValue));
    const fillWidth = width * percentage;
    
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, fillWidth, height);
    
    // Texto con valores
    if (label) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${label}: ${Math.floor(currentValue)}/${maxValue}`, x, y - 8);
    }
}

/**
 * Dibuja un rectángulo con borde redondeado
 */
function drawRoundedRect(ctx, x, y, width, height, radius, fillColor, strokeColor) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    
    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

/**
 * Verifica si un punto está dentro de un rectángulo
 */
function isPointInRect(pointX, pointY, rectX, rectY, rectWidth, rectHeight) {
    return pointX >= rectX && pointX <= rectX + rectWidth &&
           pointY >= rectY && pointY <= rectY + rectHeight;
}

/**
 * Calcula la distancia entre dos puntos
 */
function getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Espera un número específico de milisegundos (promesa)
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Obtiene el ícono de un elemento
 */
function getElementIcon(elementName) {
    if (!elementName || !ELEMENTS[elementName]) return '';
    return ELEMENTS[elementName].icon;
}

/**
 * Obtiene el nombre de un elemento
 */
function getElementName(elementName) {
    if (!elementName || !ELEMENTS[elementName]) return 'Ninguno';
    return ELEMENTS[elementName].name;
}
