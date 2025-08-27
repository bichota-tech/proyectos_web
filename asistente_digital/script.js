// ====== Definir storageKey dinámico ======
const storageKey = document.body.dataset.storage || "tasks_default";

// ====== Helpers de LocalStorage ======
function saveTasks(tasks) {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}
function getTasks() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

// ====== Validaciones extra ======
function isFutureDate(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inputDate = new Date(dateStr);
  return inputDate >= today;
}

function isDuplicate(name1, name2, date) {
  const tasks = getTasks();
  return tasks.some(
    (task) =>
      task.name1.toLowerCase() === name1.toLowerCase() &&
      task.name2.toLowerCase() === name2.toLowerCase() &&
      task.date === date
  );
}

// ====== Mostrar mensaje de error ======
function showError(input, message) {
  clearError(input); // limpia si ya había error
  const span = document.createElement("span");
  span.className = "error-message";
  span.textContent = message;
  input.insertAdjacentElement("afterend", span);
  input.classList.add("input-error");
}
function clearError(input) {
  const next = input.nextElementSibling;
  if (next && next.classList.contains("error-message")) {
    next.remove();
  }
  input.classList.remove("input-error");
}

// ====== Mostrar notificación (toast) ======
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // animación de entrada
  setTimeout(() => toast.classList.add("show"), 50);

  // autodestruir después de 3s
  /* setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000); */
}

// ====== Añadir tarea ======
function addTask(values) {
  if (!values.name1 || !values.name2 || !values.date) return;
  const tasks = getTasks();
  tasks.push(values);
  showToast("✅ Tarea añadida correctamente");
  saveTasks(tasks);
  renderTasks();
}

// ====== Renderizar tabla ======
function renderTasks() {
  const tbody = document.getElementById("taskTable");
  tbody.innerHTML = "";
  const tasks = getTasks();

  tasks.forEach((task, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${task.name1}</td>
      <td>${task.name2}</td>
      <td>${task.date}</td>
      <td><button class="delete-task" data-index="${index}">x</button></td>
    `;
    tbody.appendChild(row);
  });
}

// ====== Eliminar tarea ======
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".delete-task");
  if (!btn) return;
  const index = Number(btn.getAttribute("data-index"));
  const tasks = getTasks();
  tasks.splice(index, 1);
  saveTasks(tasks);
  renderTasks();
});

// ====== Inicializar ======
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("taskForm");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const input1 = document.getElementById("name_1");
    const input2 = document.getElementById("name_2");
    const dateInput = document.getElementById("date");

    // limpia errores anteriores
    [input1, input2, dateInput].forEach(clearError);

    let name1, name2;

    // Manejo genérico: input o select
    if (input1.tagName === "SELECT") {
      if (!input1.value || input1.value === "empty") {
        showError(input1, "Selecciona una categoría válida.");
        return;
      }
      name1 = input1.selectedOptions[0].text;
    } else {
      name1 = input1.value.trim();
      if (!name1) {
        showError(input1, "Este campo es obligatorio.");
        return;
      }
    }

    if (input2.tagName === "SELECT") {
      if (!input2.value) {
        showError(input2, "Selecciona una opción válida.");
        return;
      }
      name2 = input2.selectedOptions[0].text;
    } else {
      name2 = input2.value.trim();
      if (!name2) {
        showError(input2, "Este campo es obligatorio.");
        return;
      }
    }

    const date = dateInput.value;
    if (!date) {
      showError(dateInput, "La fecha es obligatoria.");
      return;
    }
    if (!isFutureDate(date)) {
      showError(dateInput, "La fecha debe ser hoy o futura.");
      return;
    }

    //Validación: duplicados
    if (isDuplicate(name1, name2, date)) {
      showError(input1, "Ya existe un registro con estos datos.");
      return;
    }

    addTask({ name1, name2, date });
    form.reset();
  });



  renderTasks();
});
