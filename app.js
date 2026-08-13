// TASKLY TODO APP

const STORAGE_KEY = "shiera.todos.v1";

let todos = [];
let currentFilter = "all";
let draggedTodoId = null;

// DOM ELEMENTS

const todoForm = document.querySelector("#todo-form");
const todoInput = todoForm?.querySelector("input[name='title']");
const todoList = document.querySelector("#todo-list");

const filterButtons = document.querySelectorAll(".filter-button");
const clearCompletedButton = document.querySelector(".text-button");

// Statistics
const totalTasksElement = document.querySelector(".stat-total .stat-content strong");
const activeTasksElement = document.querySelector(".stat-active .stat-content strong");
const completedTasksElement = document.querySelector(".stat-completed .stat-content strong");
const progressElement = document.querySelector(".stat-progress .stat-content strong");

// Task count badge
const taskCountElement = document.querySelector(".task-count-badge span:first-child");

// LOAD SAVED TASKS 

function hydrate() {
    const savedTodos = localStorage.getItem(STORAGE_KEY);

    if (!savedTodos) {
        todos = [];
        return;
    }

    try {
        const parsedTodos = JSON.parse(savedTodos);

        if (!Array.isArray(parsedTodos)) {
            todos = [];
            return;
        }

        todos = parsedTodos.map((todo) => ({
            id: String(todo.id),
            title: String(todo.title || ""),
            done: Boolean(todo.done)
        }));
    } catch (error) {
        console.error("Could not load saved tasks:", error);
        todos = [];
    }
}

// SAVE TASKS 

function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// CREATE UNIQUE ID

function createTodoId() {
    if (window.crypto && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ADD TODO

function addTodo(title) {
    const cleanTitle = title.trim();

    if (!cleanTitle) {
        return;
    }

    const newTodo = {
        id: createTodoId(),
        title: cleanTitle,
        done: false
    };

    todos = [...todos, newTodo];

    persist();
    render();
}

// TOGGLE TODO 

function toggleTodo(id) {
    todos = todos.map((todo) => {
        if (todo.id === id) {
            return {
                ...todo,
                done: !todo.done
            };
        }

        return todo;
    });

    persist();
    render();
}

// DELETE TODO 

function removeTodo(id) {
    todos = todos.filter((todo) => todo.id !== id);

    persist();
    render();
}

// EDIT TODO 

function editTodo(id, newTitle) {
    const cleanTitle = newTitle.trim();

    if (!cleanTitle) {
        return;
    }

    todos = todos.map((todo) => {
        if (todo.id === id) {
            return {
                ...todo,
                title: cleanTitle
            };
        }

        return todo;
    });

    persist();
    render();
}

// CLEAR COMPLETED 

function clearCompleted() {
    todos = todos.filter((todo) => !todo.done);

    persist();
    render();
}

// FILTER TODOS

function getFilteredTodos() {
    if (currentFilter === "active") {
        return todos.filter((todo) => !todo.done);
    }

    if (currentFilter === "completed") {
        return todos.filter((todo) => todo.done);
    }

    return todos;
}

// UPDATE STATISTICS 

function updateStatistics() {
    const total = todos.length;
    const completed = todos.filter((todo) => todo.done).length;
    const active = total - completed;

    const progress = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    if (totalTasksElement) {
        totalTasksElement.textContent = total;
    }

    if (activeTasksElement) {
        activeTasksElement.textContent = active;
    }

    if (completedTasksElement) {
        completedTasksElement.textContent = completed;
    }

    if (progressElement) {
        progressElement.textContent = `${progress}%`;
    }

    if (taskCountElement) {
        taskCountElement.textContent = getFilteredTodos().length;
    }
}

//  EMPTY STATE

function createEmptyState() {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";

    const icon = document.createElement("div");
    icon.className = "empty-icon";

    icon.innerHTML = `
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            <rect x="5" y="3" width="14" height="18" rx="2"></rect>
            <path d="M8 8h8"></path>
            <path d="M8 12h8"></path>
            <path d="M8 16h5"></path>
        </svg>
    `;

    const title = document.createElement("h3");

    const message = document.createElement("p");

    if (currentFilter === "active") {
        title.textContent = "No active tasks";
        message.textContent = "You're all caught up! Everything is completed.";
    } else if (currentFilter === "completed") {
        title.textContent = "No completed tasks";
        message.textContent = "Complete a task and it will appear here.";
    } else {
        title.textContent = "Your task list is clear";
        message.textContent =
            "Add your first task above and start turning your plans into progress.";
    }

    emptyState.appendChild(icon);
    emptyState.appendChild(title);
    emptyState.appendChild(message);

    return emptyState;
}

// CREATE TODO ITEM 

function createTodoElement(todo) {
    const li = document.createElement("li");

    li.className = "todo-item";

    if (todo.done) {
        li.classList.add("completed");
    }

    li.dataset.id = todo.id;
    li.draggable = true;

    // Drag handle
    const dragHandle = document.createElement("div");

    dragHandle.className = "drag-handle";
    dragHandle.title = "Drag to reorder";

    dragHandle.innerHTML = `
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
        >
            <circle cx="9" cy="6" r="1"></circle>
            <circle cx="15" cy="6" r="1"></circle>
            <circle cx="9" cy="12" r="1"></circle>
            <circle cx="15" cy="12" r="1"></circle>
            <circle cx="9" cy="18" r="1"></circle>
            <circle cx="15" cy="18" r="1"></circle>
        </svg>
    `;

    // Checkbox
    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.className = "todo-checkbox";
    checkbox.checked = todo.done;
    checkbox.setAttribute("aria-label", `Complete ${todo.title}`);

    // Content
    const content = document.createElement("div");

    content.className = "todo-content";

    const title = document.createElement("span");

    title.className = "todo-title";
    title.textContent = todo.title;

    content.appendChild(title);

    // Actions
    const actions = document.createElement("div");

    actions.className = "todo-actions";

    // Edit button
    const editButton = document.createElement("button");

    editButton.type = "button";
    editButton.className = "icon-button edit-button";
    editButton.dataset.action = "edit";
    editButton.title = "Edit task";
    editButton.setAttribute("aria-label", `Edit ${todo.title}`);

    editButton.innerHTML = `
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"></path>
        </svg>
    `;

    // Delete button
    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "icon-button delete-button";
    deleteButton.dataset.action = "delete";
    deleteButton.title = "Delete task";
    deleteButton.setAttribute("aria-label", `Delete ${todo.title}`);

    deleteButton.innerHTML = `
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            <path d="M3 6h18"></path>
            <path d="M8 6V4h8v2"></path>
            <path d="M19 6l-1 14H6L5 6"></path>
            <path d="M10 11v5"></path>
            <path d="M14 11v5"></path>
        </svg>
    `;

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    li.appendChild(dragHandle);
    li.appendChild(checkbox);
    li.appendChild(content);
    li.appendChild(actions);

    return li;
}

// RENDER

function render() {
    if (!todoList) {
        return;
    }

    const filteredTodos = getFilteredTodos();

    todoList.replaceChildren();

    if (filteredTodos.length === 0) {
        todoList.appendChild(createEmptyState());
    } else {
        const fragment = document.createDocumentFragment();

        filteredTodos.forEach((todo) => {
            fragment.appendChild(createTodoElement(todo));
        });

        todoList.appendChild(fragment);
    }

    updateStatistics();
}

//  EDIT MODE 

function startEditing(todoItem) {
    const id = todoItem.dataset.id;

    const todo = todos.find((item) => item.id === id);

    if (!todo) {
        return;
    }

    const content = todoItem.querySelector(".todo-content");

    if (!content) {
        return;
    }

    const input = document.createElement("input");

    input.type = "text";
    input.className = "edit-input";
    input.value = todo.title;
    input.maxLength = 200;
    input.setAttribute("aria-label", "Edit task");

    content.replaceChildren(input);

    input.focus();
    input.select();

    let finished = false;

    function saveEdit() {
        if (finished) {
            return;
        }

        finished = true;

        const newTitle = input.value.trim();

        if (newTitle) {
            editTodo(id, newTitle);
        } else {
            render();
        }
    }

    function cancelEdit() {
        if (finished) {
            return;
        }

        finished = true;
        render();
    }

    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            saveEdit();
        }

        if (event.key === "Escape") {
            event.preventDefault();
            cancelEdit();
        }
    });

    input.addEventListener("blur", saveEdit);
}

//  FORM EVENT 

if (todoForm && todoInput) {
    todoForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const title = todoInput.value.trim();

        if (!title) {
            todoInput.focus();
            return;
        }

        addTodo(title);

        todoForm.reset();
        todoInput.focus();
    });
}

//  LIST EVENT DELEGATION 

if (todoList) {
    todoList.addEventListener("click", (event) => {
        const todoItem = event.target.closest(".todo-item");

        if (!todoItem) {
            return;
        }

        const id = todoItem.dataset.id;

        // Checkbox
        if (event.target.matches(".todo-checkbox")) {
            toggleTodo(id);
            return;
        }

        // Edit
        const editButton = event.target.closest("[data-action='edit']");

        if (editButton) {
            startEditing(todoItem);
            return;
        }

        // Delete
        const deleteButton = event.target.closest("[data-action='delete']");

        if (deleteButton) {
            removeTodo(id);
        }
    });
}

// FILTER BUTTONS 

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const filter = button.dataset.filter;

        if (!filter) {
            return;
        }

        currentFilter = filter;

        filterButtons.forEach((filterButton) => {
            filterButton.classList.remove("active");
        });

        button.classList.add("active");

        render();
    });
});

// CLEAR COMPLETED 

if (clearCompletedButton) {
    clearCompletedButton.addEventListener("click", () => {
        const hasCompletedTasks = todos.some((todo) => todo.done);

        if (!hasCompletedTasks) {
            return;
        }

        clearCompleted();
    });
}

//  DRAG & DROP

if (todoList) {
    todoList.addEventListener("dragstart", (event) => {
        const todoItem = event.target.closest(".todo-item");

        if (!todoItem) {
            return;
        }

        draggedTodoId = todoItem.dataset.id;

        todoItem.classList.add("dragging");

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", draggedTodoId);
    });

    todoList.addEventListener("dragend", (event) => {
        const todoItem = event.target.closest(".todo-item");

        if (todoItem) {
            todoItem.classList.remove("dragging");
        }

        draggedTodoId = null;
    });

    todoList.addEventListener("dragover", (event) => {
        event.preventDefault();

        const draggedItem = todoList.querySelector(".dragging");

        if (!draggedItem) {
            return;
        }

        const targetItem = event.target.closest(".todo-item");

        if (!targetItem || targetItem === draggedItem) {
            return;
        }

        const rect = targetItem.getBoundingClientRect();

        const middleY = rect.top + rect.height / 2;

        if (event.clientY < middleY) {
            todoList.insertBefore(draggedItem, targetItem);
        } else {
            todoList.insertBefore(draggedItem, targetItem.nextSibling);
        }
    });

    todoList.addEventListener("drop", (event) => {
        event.preventDefault();

        if (!draggedTodoId) {
            return;
        }

        const visibleItems = [
            ...todoList.querySelectorAll(".todo-item")
        ];

        const visibleIds = visibleItems.map((item) => item.dataset.id);

        const reorderedVisibleTodos = visibleIds
            .map((id) => todos.find((todo) => todo.id === id))
            .filter(Boolean);

        if (currentFilter === "all") {
            todos = reorderedVisibleTodos;
        } else {
            const visibleIdSet = new Set(visibleIds);

            let visibleIndex = 0;

            todos = todos.map((todo) => {
                if (visibleIdSet.has(todo.id)) {
                    const replacement = reorderedVisibleTodos[visibleIndex];
                    visibleIndex += 1;

                    return replacement;
                }

                return todo;
            });
        }

        persist();
        render();
    });
}

//  START APP

hydrate();
render();