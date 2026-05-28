<?php

namespace App\Services;

use App\Models\Task;
use App\Models\Subtask;
use Illuminate\Support\Str;

class TaskService
{
    public function getAllTasks()
    {
        return Task::with('subtasks')->get();
    }

    public function createTask(array $data)
    {
        $task = Task::create([
            'id' => $data['id'] ?? (string) Str::uuid(),
            'title' => $data['title'],
            'column' => $data['column'],
            'category' => $data['category'] ?? 'Outros',
            'subcategory' => $data['subcategory'] ?? null,
            'color' => $data['color'] ?? '#D2C3B3',
        ]);

        if (!empty($data['subtasks'])) {
            foreach ($data['subtasks'] as $sub) {
                Subtask::create([
                    'id' => $sub['id'] ?? (string) Str::uuid(),
                    'task_id' => $task->id,
                    'text' => $sub['text'],
                    'done' => $sub['done'] ?? false,
                    'completed_at' => $sub['completed_at'] ?? null,
                ]);
            }
        }

        return $task->load('subtasks');
    }

    public function updateTask($id, array $data)
    {
        $task = Task::findOrFail($id);
        $task->update($data);
        return $task->load('subtasks');
    }

    public function deleteTask($id)
    {
        $task = Task::findOrFail($id);
        $task->delete();
        return true;
    }

    public function toggleSubtask($taskId, $subtaskId, $done, $completedAt = null)
    {
        $subtask = Subtask::where('id', $subtaskId)->where('task_id', $taskId)->firstOrFail();
        $subtask->update([
            'done' => $done,
            'completed_at' => $done ? $completedAt : null
        ]);
        
        return Task::with('subtasks')->findOrFail($taskId);
    }
}
