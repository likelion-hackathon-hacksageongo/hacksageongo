import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/AppError.js";
import { generateText } from "./ai/gemini.service.js";
import { buildTodosPrompt } from "./ai/prompts/todos.prompt.js";
import { getPlanDetail } from "./plans.service.js";

function ensureSupabaseConfigured() {
  if (!supabase) {
    throw new AppError(
      500,
      "SUPABASE_NOT_CONFIGURED",
      "Supabase environment variables are missing.",
    );
  }
}

function toTodoResponse(row, relatedPlanItem = null) {
  return {
    id: row.id,
    guestId: row.guest_id,
    title: row.title,
    description: row.description,
    scope: row.scope,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    relatedPlanId: row.related_plan_id,
    relatedPlanItemId: row.related_plan_item_id,
    relatedPlanItem,
    source: row.source,
    deferredReason: row.deferred_reason,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toTodoRow(guestId, payload, source = "manual") {
  const row = {
    guest_id: guestId,
  };

  if ("title" in payload) row.title = payload.title;
  if ("description" in payload) row.description = payload.description ?? null;
  if ("scope" in payload) row.scope = payload.scope;
  if ("status" in payload) row.status = payload.status;
  if ("priority" in payload) row.priority = payload.priority;
  if ("dueDate" in payload) row.due_date = payload.dueDate ?? null;
  if ("relatedPlanId" in payload) {
    row.related_plan_id = payload.relatedPlanId ?? null;
  }
  if ("relatedPlanItemId" in payload) {
    row.related_plan_item_id = payload.relatedPlanItemId ?? null;
  }

  row.source = source;

  return row;
}

function extractJson(text) {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return JSON.parse(trimmed);
  }

  const match = trimmed.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new AppError(
      502,
      "AI_INVALID_JSON",
      "Gemini response did not contain valid JSON.",
    );
  }

  return JSON.parse(match[0]);
}

function normalizeAiTodo(todo, planId) {
  return {
    title: todo.title,
    description: todo.description ?? null,
    scope: todo.scope,
    priority: todo.priority ?? "medium",
    dueDate: todo.dueDate ?? null,
    relatedPlanId: planId,
    relatedPlanItemId: todo.relatedPlanItemId ?? null,
  };
}

async function getRelatedPlanItemsMap(guestId, itemIds) {
  const uniqueIds = [...new Set(itemIds.filter(Boolean))];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("plan_items")
    .select("*")
    .eq("guest_id", guestId)
    .in("id", uniqueIds);

  if (error) {
    throw new AppError(500, "RELATED_PLAN_ITEMS_FETCH_FAILED", error.message);
  }

  return new Map(
    data.map((item) => [
      item.id,
      {
        id: item.id,
        title: item.title,
        periodKey: item.period_key,
        periodLabel: item.period_label,
        category: item.category,
      },
    ]),
  );
}

async function attachRelatedPlanItems(guestId, todos) {
  const relatedMap = await getRelatedPlanItemsMap(
    guestId,
    todos.map((todo) => todo.related_plan_item_id),
  );

  return todos.map((todo) =>
    toTodoResponse(todo, relatedMap.get(todo.related_plan_item_id) ?? null),
  );
}

export async function generateTodos(guestId, payload) {
  ensureSupabaseConfigured();

  const planDetail = await getPlanDetail(guestId, payload.planId);

  const currentDate = new Date().toISOString().slice(0, 10);

  const prompt = buildTodosPrompt({
    plan: planDetail.plan,
    items: planDetail.items,
    scopes: payload.scopes,
    currentDate,
  });

  const aiText = await generateText(prompt);

  let parsed;
  try {
    parsed = extractJson(aiText);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new AppError(
        502,
        "AI_INVALID_JSON",
        "Gemini response was not valid JSON.",
      );
    }

    throw error;
  }

  const todos = Array.isArray(parsed.todos)
    ? parsed.todos.map((todo) => normalizeAiTodo(todo, payload.planId))
    : [];

  if (todos.length === 0) {
    throw new AppError(
      502,
      "AI_EMPTY_TODOS",
      "Gemini did not return any todos.",
    );
  }

  if (payload.replaceExisting) {
    const { error: deleteError } = await supabase
      .from("todo_items")
      .delete()
      .eq("guest_id", guestId)
      .eq("related_plan_id", payload.planId)
      .eq("source", "ai");

    if (deleteError) {
      throw new AppError(500, "TODOS_DELETE_FAILED", deleteError.message);
    }
  }

  const rows = todos.map((todo) => ({
    ...toTodoRow(guestId, todo, "ai"),
    status: "todo",
  }));

  const { data, error } = await supabase
    .from("todo_items")
    .insert(rows)
    .select("*");

  if (error) {
    throw new AppError(500, "TODOS_CREATE_FAILED", error.message);
  }

  const result = await attachRelatedPlanItems(guestId, data);

  return {
    generatedCount: result.length,
    todos: result,
  };
}

export async function getTodos(guestId, query = {}) {
  ensureSupabaseConfigured();

  let request = supabase
    .from("todo_items")
    .select("*")
    .eq("guest_id", guestId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (query.scope) request = request.eq("scope", query.scope);
  if (query.status) request = request.eq("status", query.status);

  const { data, error } = await request;

  if (error) {
    throw new AppError(500, "TODOS_FETCH_FAILED", error.message);
  }

  return attachRelatedPlanItems(guestId, data);
}

export async function createTodo(guestId, payload) {
  ensureSupabaseConfigured();

  const { data, error } = await supabase
    .from("todo_items")
    .insert({
      ...toTodoRow(guestId, payload, "manual"),
      status: "todo",
    })
    .select("*")
    .single();

  if (error) {
    throw new AppError(500, "TODO_CREATE_FAILED", error.message);
  }

  const [todo] = await attachRelatedPlanItems(guestId, [data]);
  return todo;
}

export async function updateTodo(guestId, todoId, payload) {
  ensureSupabaseConfigured();

  const updateRow = {
    ...toTodoRow(guestId, payload, "manual"),
    updated_at: new Date().toISOString(),
  };

  delete updateRow.guest_id;
  delete updateRow.source;

  const { data, error } = await supabase
    .from("todo_items")
    .update(updateRow)
    .eq("id", todoId)
    .eq("guest_id", guestId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new AppError(500, "TODO_UPDATE_FAILED", error.message);
  }

  if (!data) {
    throw new AppError(404, "TODO_NOT_FOUND", "Todo was not found.");
  }

  const [todo] = await attachRelatedPlanItems(guestId, [data]);
  return todo;
}

export async function completeTodo(guestId, todoId) {
  ensureSupabaseConfigured();

  const { data, error } = await supabase
    .from("todo_items")
    .update({
      status: "done",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", todoId)
    .eq("guest_id", guestId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new AppError(500, "TODO_COMPLETE_FAILED", error.message);
  }

  if (!data) {
    throw new AppError(404, "TODO_NOT_FOUND", "Todo was not found.");
  }

  const [todo] = await attachRelatedPlanItems(guestId, [data]);
  return todo;
}

export async function deferTodo(guestId, todoId, payload) {
  ensureSupabaseConfigured();

  const { data, error } = await supabase
    .from("todo_items")
    .update({
      status: "deferred",
      due_date: payload.newDueDate,
      deferred_reason: payload.reason ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", todoId)
    .eq("guest_id", guestId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new AppError(500, "TODO_DEFER_FAILED", error.message);
  }

  if (!data) {
    throw new AppError(404, "TODO_NOT_FOUND", "Todo was not found.");
  }

  const [todo] = await attachRelatedPlanItems(guestId, [data]);
  return todo;
}

export async function deleteTodo(guestId, todoId) {
  ensureSupabaseConfigured();

  const { data, error } = await supabase
    .from("todo_items")
    .delete()
    .eq("id", todoId)
    .eq("guest_id", guestId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new AppError(500, "TODO_DELETE_FAILED", error.message);
  }

  if (!data) {
    throw new AppError(404, "TODO_NOT_FOUND", "Todo was not found.");
  }

  return {
    deleted: true,
    id: data.id,
  };
}
