// ====== Definir storageKey dinámico ======
const storageKey = document.body?.dataset?.storage || "tasks_default";

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
      task.name1?.toLowerCase() === name1.toLowerCase() &&
      task.name2?.toLowerCase() === name2.toLowerCase() &&
      task.date === date
  );
}

// ====== Mostrar error ======
function showError(input, message) {
  if (!input) return;
  clearError(input);
  const span = document.createElement("span");
  span.className = "error-message";
  span.textContent = message;
  input.insertAdjacentElement("afterend", span);
  input.classList.add("input-error");
}
function clearError(input) {
  if (!input) return;
  const next = input.nextElementSibling;
  if (next && next.classList.contains("error-message")) next.remove();
  input.classList.remove("input-error");
}

// ====== Toast ======
function showToast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ====== Añadir tarea ======
function addTask(values) {
  if (!values?.name1 || !values?.name2 || !values?.date) return;
  const tasks = getTasks();
  tasks.push(values);
  saveTasks(tasks);
  showToast("✅ Tarea añadida correctamente");
  renderTasks();
}

// ====== Renderizar tabla ======
function renderTasks() {
  const tbody = document.getElementById("taskTable");
  if (!tbody) return; // evitar crash si no existe
  tbody.innerHTML = "";
  const tasks = getTasks();

  tasks.forEach((task, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${task.name1}</td>
      <td>${task.name2}</td>
      <td>${task.date}</td>
      <td><button class="delete-task" data-index="${index}" aria-label="Eliminar">x</button></td>
    `;
    tbody.appendChild(row);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // ====== Cache de elementos ======
  const modal = document.getElementById("formModal");
  const modalContent = modal?.querySelector(".modal-content") || modal;
  const openBtn = document.getElementById("openFormBtn");
  const closeBtn = document.getElementById("closeFormBtn");
  const taskForm = document.getElementById("taskForm");
  const taskFormDesktopContainer = document.querySelector(".task-form-desktop");

  // Función robusta para mover el formulario según layout
  function checkLayout(mq) {
    const isDesktop = (typeof mq === "object") ? !!mq.matches : window.matchMedia("(min-width:768px)").matches;
    if (isDesktop) {
      if (taskFormDesktopContainer && taskForm && modalContent.contains(taskForm)) {
        taskFormDesktopContainer.appendChild(taskForm); // mueve TODO el form con labels incluidos
      }
    } else {
      if (modalContent && taskForm && !modalContent.contains(taskForm)) {
        modalContent.appendChild(taskForm);
      }
    }
  }

  const mediaQuery = window.matchMedia("(min-width: 768px)");
  // API moderna y fallback para compatibilidad
  if (mediaQuery.addEventListener) mediaQuery.addEventListener("change", checkLayout);
  else mediaQuery.addListener(checkLayout);
  checkLayout(mediaQuery); // ejecutar al cargar

  // Mobile: abrir y cerrar modal
  openBtn?.addEventListener("click", () => modal?.classList.add("active"));
  closeBtn?.addEventListener("click", () => modal?.classList.remove("active"));
  modal?.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("active"); });

  // ===== Helpers para obtener valores legibles y raw (validación) =====
  function getFieldDisplayValue(field) {
    if (!field) return "";
    const tag = field.tagName?.toLowerCase();
    const type = field.type?.toLowerCase?.();

    if (tag === "select") {
      return field.options[field.selectedIndex]?.text?.trim() ?? field.value ?? "";
    }
    if (type === "checkbox") {
      const id = field.id;
      if (id) {
        const lab = document.querySelector(`label[for="${id}"]`);
        if (lab) return field.checked ? lab.textContent.trim() : "No";
      }
      return field.checked ? "Sí" : "No";
    }
    if (type === "radio") {
      const checked = document.querySelector(`input[name="${field.name}"]:checked`);
      if (checked) {
        const id2 = checked.id;
        const lab = id2 ? document.querySelector(`label[for="${id2}"]`) : null;
        return (lab ? lab.textContent.trim() : checked.value);
      }
      return "";
    }
    return field.value?.trim() ?? "";
  }

  function getRawValue(field) {
    if (!field) return "";
    const tag = field.tagName?.toLowerCase();
    const type = field.type?.toLowerCase?.();

    if (tag === "select") return field.value;
    if (type === "checkbox") return field.checked;
    if (type === "radio") {
      const checked = document.querySelector(`input[name="${field.name}"]:checked`);
      return checked ? checked.value : "";
    }
    return field.value?.trim() ?? "";
  }


  // Listener submit (sirve tanto mobile como desktop)
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const input1 = document.getElementById("name_1");
    const input2 = document.getElementById("name_2");
    const dateInput = document.getElementById("date");

    [input1, input2, dateInput].forEach(clearError);

    // usamos raw para validaciones y display para guardar lo legible por el usuario
    const rawName1 = getRawValue(input1);
    const rawName2 = getRawValue(input2);
    const rawDate = getRawValue(dateInput);

    const name1 = getFieldDisplayValue(input1);
    const name2 = getFieldDisplayValue(input2);
    const date = getFieldDisplayValue(dateInput);

    if (!rawName1) return showError(input1, "Obligatorio");
    if (!rawName2) return showError(input2, "Obligatorio");
    if (!rawDate) return showError(dateInput, "Obligatorio");
    if (!isFutureDate(rawDate)) return showError(dateInput, "Fecha inválida");
    if (isDuplicate(name1, name2, date)) return showError(input1, "Duplicado");


    addTask({ name1, name2, date });
    taskForm.reset();
    if (!mediaQuery.matches) modal.classList.remove("active"); // cerrar solo mobile
  });

  // ====== Delegación para eliminar ======
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".delete-task");
    if (!btn) return;
    const index = Number(btn.getAttribute("data-index"));
    const tasks = getTasks();
    tasks.splice(index, 1);
    saveTasks(tasks);
    renderTasks();
  });

  // ====== Inicializar tabla ======
  renderTasks();
});
