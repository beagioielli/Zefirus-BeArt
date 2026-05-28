<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\TaskService;

class TaskController extends Controller
{
    private $taskService;

    public function __construct(TaskService $taskService)
    {
        $this->taskService = $taskService;
    }

    public function index()
    {
        return response()->json($this->taskService->getAllTasks());
    }

    public function store(Request $request)
    {
        $task = $this->taskService->createTask($request->all());
        return response()->json($task, 201);
    }

    public function update(Request $request, $id)
    {
        $task = $this->taskService->updateTask($id, $request->all());
        return response()->json($task);
    }

    public function destroy($id)
    {
        $this->taskService->deleteTask($id);
        return response()->json(null, 204);
    }

    public function toggleSubtask(Request $request, $taskId, $subtaskId)
    {
        $task = $this->taskService->toggleSubtask(
            $taskId, 
            $subtaskId, 
            $request->input('done'), 
            $request->input('completedAt')
        );
        return response()->json($task);
    }
}
