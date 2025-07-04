// Массив для хранения блоков
let blocks = [];

// Функция для добавления блока
function addBlock() {
    const block = {
        id: Date.now(),
        x: Math.random() * 550, // Случайная позиция внутри канваса
        y: Math.random() * 350,
        width: 50,
        height: 50,
        color: 'blue'
    };
    blocks.push(block);
    renderCanvas();
}

// Функция для отрисовки блоков
function renderCanvas() {
    const canvasDiv = document.getElementById('canvas');
    canvasDiv.innerHTML = ''; // Очищаем канвас
    blocks.forEach(block => {
        const blockElement = document.createElement('div');
        blockElement.style.position = 'absolute';
        blockElement.style.left = `${block.x}px`;
        blockElement.style.top = `${block.y}px`;
        blockElement.style.width = `${block.width}px`;
        blockElement.style.height = `${block.height}px`;
        blockElement.style.backgroundColor = block.color;
        canvasDiv.appendChild(blockElement);
    });
}

// Обработчик для кнопки "Сохранить"
document.getElementById('save').addEventListener('click', () => {
    localStorage.setItem('roomDesign', JSON.stringify(blocks));
    alert('Прогресс сохранен!');
});

// Обработчик для загрузки сохраненного прогресса
window.addEventListener('load', () => {
    const savedData = localStorage.getItem('roomDesign');
    if (savedData) {
        blocks = JSON.parse(savedData);
        renderCanvas();
    }
});

// Обработчик для кнопки "Добавить блок"
document.getElementById('add').addEventListener('click', addBlock);

// Обработчик для кнопки "Создать комнату"
document.getElementById('create').addEventListener('click', () => {
    blocks = [];
    localStorage.removeItem('roomDesign');
    renderCanvas();
    alert('Новая комната создана!');
});
