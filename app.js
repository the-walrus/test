'use strict';

const STORAGE_KEY = 'todo.tasks.v1';
const form = document.querySelector('#task-form');
const input = document.querySelector('#task-input');
const list = document.querySelector('#task-list');
const counter = document.querySelector('#counter');
const emptyState = document.querySelector('#empty-state');
const message = document.querySelector('#message');
let tasks = loadTasks();

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(task =>
      task && typeof task.id === 'string' && typeof task.text === 'string' &&
      task.text.trim().length > 0 && typeof task.completed === 'boolean'
    ) || new Set(parsed.map(task => task.id)).size !== parsed.length) {
      throw new Error('Invalid saved tasks');
    }
    return parsed;
  } catch {
    message.textContent = 'Не удалось загрузить сохранённые задачи. Можно начать новый список.';
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    message.textContent = '';
  } catch {
    message.textContent = 'Не удалось сохранить задачи. Они доступны до обновления страницы.';
  }
}

function renderTasks() {
  const fragment = document.createDocumentFragment();
  for (const task of tasks) {
    const item = document.createElement('li');
    item.className = task.completed ? 'task completed' : 'task';
    item.dataset.id = task.id;

    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;
    label.append(checkbox, text);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'delete-button';
    remove.setAttribute('aria-label', `Удалить задачу: ${task.text}`);
    // Only this fixed icon uses HTML; task text is always inserted as textContent.
    remove.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"/></svg>';
    item.append(label, remove);
    fragment.append(item);
  }
  list.replaceChildren(fragment);
  emptyState.hidden = tasks.length > 0;
  counter.textContent = `${tasks.filter(task => task.completed).length} / ${tasks.length} выполнено`;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    input.setCustomValidity('Введите текст задачи.');
    input.reportValidity();
    return;
  }
  tasks.push({ id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`, text, completed: false });
  saveTasks();
  renderTasks();
  form.reset();
  input.focus();
});

input.addEventListener('input', () => input.setCustomValidity(''));

list.addEventListener('change', event => {
  if (!event.target.matches('input[type="checkbox"]')) return;
  const task = tasks.find(task => task.id === event.target.closest('.task').dataset.id);
  if (!task) return;
  task.completed = event.target.checked;
  saveTasks();
  event.target.closest('.task').classList.toggle('completed', task.completed);
  counter.textContent = `${tasks.filter(task => task.completed).length} / ${tasks.length} выполнено`;
});

list.addEventListener('click', event => {
  const button = event.target.closest('.delete-button');
  if (!button) return;
  const item = button.closest('.task');
  const nextFocus = item.nextElementSibling?.querySelector('.delete-button')
    ?? item.previousElementSibling?.querySelector('.delete-button');
  const nextId = nextFocus?.closest('.task').dataset.id;
  tasks = tasks.filter(task => task.id !== item.dataset.id);
  saveTasks();
  renderTasks();
  const nextButton = Array.from(list.children).find(row => row.dataset.id === nextId)?.querySelector('.delete-button');
  (nextButton ?? input).focus();
});

renderTasks();
