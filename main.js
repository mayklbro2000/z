const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const tabsContainer = document.getElementById('tabs');
const addRoomBtn = document.getElementById('addRoom');
const addBlockBtn = document.getElementById('addBlock');
const saveDesignBtn = document.getElementById('saveDesign');
const statusDiv = document.getElementById('status');
const contextMenu = document.getElementById('contextMenu');

// Загрузка сохранённых данных или создание новой комнаты
const savedDesigns = localStorage.getItem('roomDesigns');
let rooms = savedDesigns ? JSON.parse(savedDesigns) : [{
    id: generateId(),
    name: 'Комната 1',
    width: 800,
    height: 600,
    blocks: [],
    door: null
}];
let currentRoomId = rooms[0]?.id || null;
let draggedBlock = null;
let draggedDoor = null;
let offsetX, offsetY;

class Block {
    constructor(id, x, y, width, height, isOn = false, isEmpty = false) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isOn = isOn;
        this.isEmpty = isEmpty;
    }

    draw() {
        ctx.fillStyle = this.isEmpty ? '#808080' : (this.isOn ? '#00FF00' : '#0000FF');
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

class Door {
    constructor(x, y, edge) {
        this.x = x;
        this.y = y;
        this.width = edge === 'top' || edge === 'bottom' ? 60 : 10;
        this.height = edge === 'left' || edge === 'right' ? 60 : 10;
        this.edge = edge;
    }

    draw() {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    updatePosition(x, y, canvasWidth, canvasHeight) {
        const margin = 10;
        if (x <= margin) {
            this.edge = 'left';
            this.x = 0;
            this.y = Math.max(0, Math.min(y, canvasHeight - this.height));
            this.width = 10;
            this.height = 60;
        } else if (x >= canvasWidth - margin) {
            this.edge = 'right';
            this.x = canvasWidth - 10;
            this.y = Math.max(0, Math.min(y, canvasHeight - this.height));
            this.width = 10;
            this.height = 60;
        } else if (y <= margin) {
            this.edge = 'top';
            this.x = Math.max(0, Math.min(x, canvasWidth - this.width));
            this.y = 0;
            this.width = 60;
            this.height = 10;
        } else if (y >= canvasHeight - margin) {
            this.edge = 'bottom';
            this.x = Math.max(0, Math.min(x, canvasWidth - this.width));
            this.y = canvasHeight - 10;
            this.width = 60;
            this.height = 10;
        }
    }
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function getCurrentRoom() {
    return rooms.find(room => room.id === currentRoomId) || null;
}

function updateCanvasSize() {
    const room = getCurrentRoom();
    if (room) {
        canvas.width = room.width;
        canvas.height = room.height;
        canvas.style.display = 'block';
        drawRoom();
    } else {
        canvas.style.display = 'none';
        statusDiv.textContent = 'Нет комнат. Создайте новую комнату.';
    }
}

function drawRoom() {
    const room = getCurrentRoom();
    if (!room) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    room.blocks.forEach(block => block.draw());
    if (room.door) room.door.draw();
}

function renderTabs() {
    tabsContainer.innerHTML = '';
    if (rooms.length === 0) {
        tabsContainer.style.display = 'none';
        updateCanvasSize();
        return;
    }
    tabsContainer.style.display = 'flex';
    rooms.forEach(room => {
        const tab = document.createElement('div');
        tab.className = `px-4 py-2 rounded-t ${room.id === currentRoomId ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'} cursor-pointer`;
        tab.textContent = room.name;
        tab.addEventListener('click', () => {
            currentRoomId = room.id;
            renderTabs();
            updateCanvasSize();
        });
        tab.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            contextMenu.innerHTML = `
                <div onclick="resizeRoom()">Изменить размер</div>
                <div onclick="renameRoom('${room.id}')">Переименовать</div>
                <div onclick="duplicateRoom('${room.id}')">Дублировать</div>
                <div onclick="deleteRoom('${room.id}')">Удалить</div>
            `;
            contextMenu.classList.remove('hidden');
            contextMenu.style.left = `${e.clientX}px`;
            contextMenu.style.top = `${e.clientY}px`;
        });
        tabsContainer.appendChild(tab);
    });
}

addRoomBtn.addEventListener('click', () => {
    const newRoom = {
        id: generateId(),
        name: `Комната ${rooms.length + 1}`,
        width: 800,
        height: 600,
        blocks: [],
        door: new Door(0, 300, 'left')
    };
    rooms.push(newRoom);
    currentRoomId = newRoom.id;
    renderTabs();
    updateCanvasSize();
    statusDiv.textContent = 'Новая комната создана';
});

addBlockBtn.addEventListener('click', () => {
    const room = getCurrentRoom();
    if (!room) {
        statusDiv.textContent = 'Создайте комнату перед добавлением блока';
        return;
    }
    const newBlock = new Block(generateId(), Math.random() * (room.width - 50), Math.random() * (room.height - 50), 50, 50);
    room.blocks.push(newBlock);
    drawRoom();
    statusDiv.textContent = 'Блок добавлен';
});

saveDesignBtn.addEventListener('click', () => {
    localStorage.setItem('roomDesigns', JSON.stringify(rooms));
    statusDiv.textContent = 'Дизайн сохранен';
});

canvas.addEventListener('mousedown', (e) => {
    const room = getCurrentRoom();
    if (!room) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (e.button === 0) {
        draggedBlock = room.blocks.find(block =>
            mouseX >= block.x && mouseX <= block.x + block.width &&
            mouseY >= block.y && mouseY <= block.y + block.height
        );
        if (draggedBlock) {
            offsetX = mouseX - draggedBlock.x;
            offsetY = mouseY - draggedBlock.y;
        } else if (room.door &&
            mouseX >= room.door.x && mouseX <= room.door.x + room.door.width &&
            mouseY >= room.door.y && mouseY <= room.door.y + room.door.height
        ) {
            draggedDoor = room.door;
            offsetX = mouseX - draggedDoor.x;
            offsetY = mouseY - draggedDoor.y;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    const room = getCurrentRoom();
    if (!room) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (draggedBlock) {
        draggedBlock.x = Math.max(0, Math.min(mouseX - offsetX, room.width - draggedBlock.width));
        draggedBlock.y = Math.max(0, Math.min(mouseY - offsetY, room.height - draggedBlock.height));
        drawRoom();
    } else if (draggedDoor) {
        draggedDoor.updatePosition(mouseX - offsetX, mouseY - offsetY, room.width, room.height);
        drawRoom();
    }
});

canvas.addEventListener('mouseup', () => {
    draggedBlock = null;
    draggedDoor = null;
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const room = getCurrentRoom();
    if (!room) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const clickedBlock = room.blocks.find(block =>
        mouseX >= block.x && mouseX <= block.x + block.width &&
        mouseY >= block.y && mouseY <= block.y + block.height
    );

    if (clickedBlock) {
        contextMenu.innerHTML = clickedBlock.isEmpty ? `
            <div onclick="deleteBlock('${clickedBlock.id}')">Удалить</div>
        ` : `
            <div onclick="toggleBlock('${clickedBlock.id}')">${clickedBlock.isOn ? 'Выключить' : 'Включить'}</div>
            <div onclick="deleteBlock('${clickedBlock.id}')">Удалить</div>
            <div onclick="addEmptyBlock()">Добавить пустой блок</div>
        `;
        contextMenu.classList.remove('hidden');
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
    } else {
        contextMenu.classList.add('hidden');
    }
});

document.addEventListener('click', (e) => {
    if (!contextMenu.contains(e.target)) {
        contextMenu.classList.add('hidden');
    }
});

window.toggleBlock = (id) => {
    const room = getCurrentRoom();
    if (!room) return;
    const block = room.blocks.find(b => b.id === id);
    if (block && !block.isEmpty) {
        block.isOn = !block.isOn;
        drawRoom();
        contextMenu.classList.add('hidden');
    }
};

window.deleteBlock = (id) => {
    const room = getCurrentRoom();
    if (!room) return;
    room.blocks = room.blocks.filter(b => b.id !== id);
    drawRoom();
    contextMenu.classList.add('hidden');
    statusDiv.textContent = 'Блок удален';
};

window.addEmptyBlock = () => {
    const room = getCurrentRoom();
    if (!room) return;
    const newBlock = new Block(generateId(), Math.random() * (room.width - 50), Math.random() * (room.height - 50), 50, 50, false, true);
    room.blocks.push(newBlock);
    drawRoom();
    contextMenu.classList.add('hidden');
    statusDiv.textContent = 'Пустой блок добавлен';
};

window.resizeRoom = () => {
    const room = getCurrentRoom();
    if (!room) return;
    const newWidth = prompt('Введите новую ширину комнаты (px):', room.width);
    const newHeight = prompt('Введите новую высоту комнаты (px):', room.height);
    if (newWidth && newHeight && !isNaN(newWidth) && !isNaN(newHeight)) {
        room.width = Math.max(400, Math.min(parseInt(newWidth), 2000));
        room.height = Math.max(300, Math.min(parseInt(newHeight), 2000));
        room.blocks.forEach(block => {
            block.x = Math.min(block.x, room.width - block.width);
            block.y = Math.min(block.y, room.height - block.height);
        });
        if (room.door) {
            room.door.updatePosition(room.door.x, room.door.y, room.width, room.height);
        }
        updateCanvasSize();
        statusDiv.textContent = 'Размер комнаты изменен';
    }
    contextMenu.classList.add('hidden');
};

window.renameRoom = (id) => {
    const room = rooms.find(r => r.id === id);
    if (!room) return;
    const newName = prompt('Введите новое название комнаты:', room.name);
    if (newName) {
        room.name = newName;
        renderTabs();
        statusDiv.textContent = 'Комната переименована';
    }
    contextMenu.classList.add('hidden');
};

window.duplicateRoom = (id) => {
    const currentRoom = rooms.find(r => r.id === id);
    if (!currentRoom) return;
    const newRoom = {
        id: generateId(),
        name: `${currentRoom.name} (копия)`,
        width: currentRoom.width,
        height: currentRoom.height,
        blocks: currentRoom.blocks.map(block => new Block(block.id, block.x, block.y, block.width, block.height, block.isOn, block.isEmpty)),
        door: currentRoom.door ? new Door(currentRoom.door.x, currentRoom.door.y, currentRoom.door.edge) : null
    };
    rooms.push(newRoom);
    currentRoomId = newRoom.id;
    renderTabs();
    updateCanvasSize();
    contextMenu.classList.add('hidden');
    statusDiv.textContent = 'Комната дублирована';
};

window.deleteRoom = (id) => {
    rooms = rooms.filter(room => room.id !== id);
    currentRoomId = rooms[0]?.id || null;
    renderTabs();
    updateCanvasSize();
    contextMenu.classList.add('hidden');
    statusDiv.textContent = rooms.length > 0 ? 'Комната удалена' : 'Все комнаты удалены';
};

// Инициализация двери, если отсутствует
if (getCurrentRoom() && !getCurrentRoom().door) {
    getCurrentRoom().door = new Door(0, 300, 'left');
}
renderTabs();
updateCanvasSize();
