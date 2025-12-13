import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const password = formData.get('password') as string;

    if (!file || !password) {
      console.error('Missing file or password');
      return new Response(
        JSON.stringify({ error: 'File and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing file: ${file.name}, size: ${file.size}`);

    // Read the file as array buffer
    const fileBuffer = await file.arrayBuffer();
    const inputBytes = new Uint8Array(fileBuffer);

    // Write input file to temp location
    const tempInputPath = `/tmp/input_${Date.now()}.pdf`;
    const tempOutputPath = `/tmp/output_${Date.now()}.pdf`;
    
    await Deno.writeFile(tempInputPath, inputBytes);
    console.log(`Written input file to ${tempInputPath}`);

    // Use qpdf to encrypt the PDF with password protection
    const process = new Deno.Command("qpdf", {
      args: [
        "--encrypt",
        password,        // user password
        password,        // owner password
        "256",           // 256-bit AES encryption
        "--",
        tempInputPath,
        tempOutputPath
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await process.output();
    
    const stderrText = new TextDecoder().decode(stderr);
    const stdoutText = new TextDecoder().decode(stdout);
    
    if (code !== 0) {
      console.error(`qpdf error: ${stderrText}`);
      console.error(`qpdf stdout: ${stdoutText}`);
      
      // Clean up temp files
      try { await Deno.remove(tempInputPath); } catch (_e) { /* ignore */ }
      
      return new Response(
        JSON.stringify({ error: 'Failed to encrypt PDF. The file may be corrupted or already encrypted.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('qpdf encryption successful');

    // Read the encrypted file
    const encryptedBytes = await Deno.readFile(tempOutputPath);
    
    // Clean up temp files
    try { await Deno.remove(tempInputPath); } catch (_e) { /* ignore */ }
    try { await Deno.remove(tempOutputPath); } catch (_e) { /* ignore */ }

    console.log(`Returning encrypted PDF, size: ${encryptedBytes.length}`);

    return new Response(encryptedBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="encrypted_${file.name}"`,
      },
    });
  } catch (error: unknown) {
    console.error('Error in encrypt-pdf function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
