'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export default function CVTestPage() {
    const [rawText, setRawText] = useState('');
    const [provider, setProvider] = useState('google');
    const [model, setModel] = useState('gemini-2.5-flash');
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [result, setResult] = useState<any>(null);
    const [rawResponse, setRawResponse] = useState<string>('');

    const addLog = (msg: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
    };

    const testExtraction = async () => {
        if (!rawText.trim()) {
            addLog('ERROR: No text provided');
            return;
        }
        if (!apiKey.trim()) {
            addLog('ERROR: No API key provided');
            return;
        }

        setLoading(true);
        setResult(null);
        setRawResponse('');
        setLogs([]);

        addLog('Starting test...');
        addLog(`Provider: ${provider}`);
        addLog(`Model: ${model}`);
        addLog(`Text length: ${rawText.length} chars`);

        try {
            addLog('Sending request to /api/cv/extract/test...');

            const formData = new FormData();
            formData.append('rawText', rawText);
            formData.append('provider', provider);
            formData.append('model', model);

            const res = await fetch('/api/cv/extract/test', {
                method: 'POST',
                headers: {
                    'x-api-key-bypass': apiKey,
                },
                body: formData
            });

            addLog(`Response status: ${res.status}`);

            const data = await res.json();
            addLog(`Response received`);

            console.log('FULL RESPONSE:', data);
            setResult(data);
            
            if (data.rawAIResponse) {
                setRawResponse(data.rawAIResponse);
                addLog(`Raw AI response length: ${data.rawAIResponse.length}`);
            }

            if (data.success) {
                addLog(`SUCCESS! Extracted CV`);
                addLog(`Name: ${data.parsed?.personal_info?.full_name || 'N/A'}`);
                addLog(`Email: ${data.parsed?.personal_info?.email || 'N/A'}`);
                addLog(`Work Experience: ${data.parsed?.work_experience?.length || 0} items`);
                addLog(`Education: ${data.parsed?.education?.length || 0} items`);
                addLog(`Skills: ${data.parsed?.skills?.length || 0} items`);
            } else {
                addLog(`FAILED: ${data.error || 'Parse failed'}`);
                if (data.parseError) {
                    addLog(`Parse Error: ${data.parseError}`);
                }
            }

        } catch (err: any) {
            addLog(`EXCEPTION: ${err.message}`);
            console.error('Test error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <h1 className="text-2xl font-bold mb-6">CV Extraction Test Page</h1>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">API Key (direct)</label>
                            <input
                                type="password"
                                className="w-full p-2 border rounded"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                placeholder="AIza..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Provider</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={provider}
                                    onChange={e => setProvider(e.target.value)}
                                >
                                    <option value="google">Google</option>
                                    <option value="openai">OpenAI</option>
                                    <option value="anthropic">Anthropic</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Model</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    value={model}
                                    onChange={e => setModel(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>CV Text (paste or type)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            className="min-h-[200px] font-mono text-sm"
                            value={rawText}
                            onChange={e => setRawText(e.target.value)}
                            placeholder="Paste CV text here..."
                        />
                    </CardContent>
                </Card>

                <Button
                    onClick={testExtraction}
                    disabled={loading || !rawText.trim() || !apiKey.trim()}
                    className="w-full"
                >
                    {loading ? 'Analyzing...' : 'Test Extraction'}
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle>Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-black text-green-400 p-4 rounded font-mono text-xs max-h-[200px] overflow-auto">
                            {logs.length === 0 ? (
                                <span className="text-gray-500">No logs yet...</span>
                            ) : (
                                logs.map((log, i) => <div key={i}>{log}</div>)
                            )}
                        </div>
                    </CardContent>
                </Card>

                {rawResponse && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-orange-600">Raw AI Response (before parsing)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-orange-50 dark:bg-orange-950 p-4 rounded text-xs overflow-auto max-h-[400px] whitespace-pre-wrap">
                                {rawResponse}
                            </pre>
                        </CardContent>
                    </Card>
                )}

                {result && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Parsed Result</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-auto max-h-[400px]">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
