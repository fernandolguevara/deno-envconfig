# envconfig

this library is based on
[envconfig](https://github.com/kelseyhightower/envconfig) for gloang

## marks

### types

```md
- `string
- `bool
- `number
- `date
```

### val

```md
- `required
- `max
- `min
```

### modifiers

```md
- `env
- `prefix
- `suffix
- `split_words
- `split_values
- `uppercase
- `lowercase
- `format
```

## Example

```typescript
const _envconfig = {
  log: {
    level: "`string`default:DEBUG",
  },
  server: {
    hostname: "`string`default:0.0.0.0",
    port: "`default:3003`number",
  },
  app: {
    name: "`string`default:my-app",
    description: "`string`default:my awesome app",
    contact: "`string`default:~",
    version: "`string`default:~",
  },
  db: {
    type: "`string`default:memory",
    createSchema: "`bool`split_words`default:true",
    dropSchemaIfExists: "`bool`split_words`default:true",
    shared: {
      __prefix: "",
      hostname: "`string",
      port: "`number`default:-1",
      user: "`string",
      password: "`string",
      database: "`string",
    },
    sqlite: {
      path: "`string`default::memory:",
    },
    mysql: {
      connectionLimit: "`number`split_words`default:4",
    },
    postgres: {
      applicationName: "`string`split_words`default:deno-nostr",
      connectionsAttemps: "`number`split_words`default:1",
      hostType: "`string`split_words`default:tcp",
      tlsEnforce: "`bool`split_words`default:false",
      maxIndexKeys: "`string`default:32",
    },
  },
};

const e = parse({}, _envconfig);
/*  {
  log: { level: "DEBUG" },
  server: { hostname: "0.0.0.0", port: 3003 },
  app: {
    name: "my-app",
    description: "my awesome app",
    contact: "~",
    version: "~",
  },
  db: {
    type: "memory",
    createSchema: true,
    dropSchemaIfExists: true,
    shared: {
      hostname: undefined,
      port: -1,
      user: undefined,
      password: undefined,
      database: undefined,
    },
    sqlite: { path: ":memory:" },
    mysql: { connectionLimit: 4 },
    postgres: {
      applicationName: "my-app",
      connectionsAttemps: 1,
      hostType: "tcp",
      tlsEnforce: false,
      maxIndexKeys: "32",
    },
  },
} */
```
