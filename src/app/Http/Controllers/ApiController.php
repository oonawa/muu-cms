<?php

namespace App\Http\Controllers;

use App\Models\Blueprint;
use Illuminate\Http\Request;

class ApiController extends Controller
{
    public function show(Request $request, string $slug)
    {
        $blueprint = Blueprint::where('slug', $slug)->first();

        if (!$blueprint) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $parameterNames = $blueprint->spec->parameters()->orderBy('sort_order')->pluck('name')->toArray();

        if ($blueprint->type === 'single') {
            return $this->showSingle($blueprint, $parameterNames);
        }

        return $this->showMultiple($request, $blueprint, $parameterNames);
    }

    private function showSingle(Blueprint $blueprint, array $parameterNames)
    {
        $content = $blueprint->contents()->first();

        if (!$content) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json($this->filterData($content->data, $parameterNames));
    }

    private function showMultiple(Request $request, Blueprint $blueprint, array $parameterNames)
    {
        $limit = min((int) $request->query('limit', 10), 100);
        $offset = (int) $request->query('offset', 0);

        $totalCount = $blueprint->contents()->count();
        $contents = $blueprint->contents()->skip($offset)->take($limit)->get();

        $filtered = $contents->map(fn ($c) => $this->filterData($c->data, $parameterNames))->values();

        return response()->json([
            'contents' => $filtered,
            'totalCount' => $totalCount,
        ]);
    }

    private function filterData(array $data, array $parameterNames): array
    {
        $result = [];
        foreach ($parameterNames as $name) {
            $result[$name] = $data[$name] ?? null;
        }
        return $result;
    }
}
