# TOON MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that provides tools for encoding and decoding **TOON (Token-Oriented Object Notation)**.

TOON is a compact, human-readable format designed to represent JSON data using significantly fewer tokens, making it ideal for LLM prompts and context optimization.

**👉 Learn more about the format at [toonformat.dev](https://toonformat.dev)**

## Features

This server exposes two core tools to MCP clients (specifically tested with Gemini CLI):

* **`encode_toon`**: Converts JSON strings into TOON format to save tokens.
* **`decode_toon`**: Converts TOON formatted text back into standard JSON.

## Usage

### Quick Start with Gemini CLI

To use this server with the [Gemini CLI](https://www.npmjs.com/package/@google/gemini-cli), follow these steps:

1. **Install Gemini CLI** (if you haven't already):

    ```bash
    npm install -g @google/gemini-cli@latest
    ```

2. **Configure the MCP Server**:
    You can register the server by creating or editing your Gemini settings file, typically located at `~/.gemini/settings.json` (Global) or `.gemini/settings.json` (Project-local).

    Add the following configuration:

    ```json
    {
      "mcpServers": {
        "toon": {
          "command": "npx",
          "args": ["-y", "git+https://github.com/kweinmeister/toon-mcp.git"]
        }
      }
    }
    ```

3. **Run Gemini CLI**:
    Start the CLI interface. The tools should now be available to the model.

    ```bash
    gemini
    ```

## Tools

### 1. `encode_toon`

Converts JSON data into the compact TOON format.

**Parameters:**

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `json` | `string` | **Required** | The JSON data (serialized as a string) to encode. |
| `indent` | `number` | `2` | Number of spaces for indentation. |
| `delimiter` | `string` | `,` | Delimiter for arrays/rows. Options: `,` (comma), `\t` (tab), `\|` (pipe). |
| `keyFolding` | `string` | `"off"` | Collapse single-key wrapper chains (e.g., `a.b.c`). Options: `"off"`, `"safe"`. |
| `flattenDepth` | `number` | `Infinity` | Maximum depth to apply key folding. |
| `replacer` | `(string\|number)[]` | `undefined` | Array of properties to filter/include in the output. |

**Example Prompt in Gemini CLI:**
> "Use the encode_toon tool to convert this JSON into TOON format: `{"users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]}`"

**Output:**

```text
users[2]{id,name}:
  1,Alice
  2,Bob
```

### 2. `decode_toon`

Parses TOON formatted text back into standard JSON.

**Parameters:**

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `toon` | `string` | **Required** | The TOON formatted string to decode. |
| `strict` | `boolean` | `true` | Enforce strict validation (e.g., checking declared array lengths). |
| `expandPaths` | `string` | `"off"` | Reconstruct dotted keys into nested objects. Options: `"off"`, `"safe"`. |
| `indent` | `number` | `undefined` | Number of spaces for indentation. |

## Transports

This server supports both HTTP Server-Sent Events (SSE) and Standard IO (stdio).

### HTTP / SSE (Default)

Useful for remote deployments (like Cloud Run) or web-based MCP clients.

```bash
# Starts on port 8080 by default
npm start

# Custom port
npm start -- --port 3000
```

### Stdio

Used by local clients like Gemini CLI.

```bash
npm run start:stdio
```

## Development

### Installation

```bash
git clone https://github.com/kweinmeister/toon-mcp
cd toon-mcp
npm install
```

### Testing

Run the unit tests to ensure the server tools are functioning correctly:

```bash
npm test
```

### Debugging with MCP Inspector

You can use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) to inspect and test the server's tools interactively via a web interface.

```bash
npx fastmcp inspect index.ts
```

### Building & Linting

```bash
# Linting
npx biome check .

# Type checking
npx tsc --noEmit
```
