import {
  assertEquals,
  assertInstanceOf,
  assertIsError,
  assertThrows,
  describe,
  it,
} from "../deps.ts";

export class ConfigurationInvalidError extends Error {}
export class ArgumentInvalidError extends Error {}

const configErrorMessage = (r: string, k: string, c: string) =>
  `mark: "\`${r}" config: "${c}" on key: "${k}"`;

const configError = (r: string, k: string, c: string, m?: string) =>
  new ConfigurationInvalidError(
    `${configErrorMessage(r, k, c)}${m ? ` ${m}` : ""}`,
  );

const duplicateMarkError = (r: string, k: string, c: string, m?: string) =>
  configError(r, k, c, m || "should not be duplicated.");

const invalidNumberError = (k: string, c: string, v: unknown) =>
  configError("number", k, c, `should be a number, val:${JSON.stringify(v)}`);

const invalidDateError = (k: string, c: string, v: unknown) =>
  configError("date", k, c, `should be a valid date, val:${JSON.stringify(v)}`);

const invalidValueError = (r: string, k: string, c: string, v: unknown) =>
  configError(
    r,
    k,
    c,
    `should have a valid value ex: \`${r}:my-val, val:${JSON.stringify(v)}`,
  );

const types = ["number", "date", "string", "bool"];

const toggleMarks = Object.entries({
  "split_values": undefined,
  "uppercase": (key: string, conf: string, metadata: any) => {
    if (metadata.lowercase) {
      throw configError(
        "`uppercase",
        key,
        conf,
        "can not be used with `lowercase mark",
      );
    }
  },
  "lowercase": (key: string, conf: string, metadata: any) => {
    if (metadata.uppercase) {
      throw configError(
        "`lowercase",
        key,
        conf,
        "can not be used with `uppercase mark",
      );
    }
  },
  "required": undefined,
  "split_words": undefined,
});

const valuedMarks = Object.entries({
  // mark: undefined | [val,exec]
  max: undefined,
  min: undefined,
  env: [undefined, (k: string, c: string, metadata: any) => {
    metadata.split_words = false;
    if (!(metadata.key = metadata.env)) {
      throw invalidValueError("env", k, c, metadata.env);
    }
  }],
  default: undefined,
  suffix: [undefined, (_: string, _1: string, metadata: any) => {
    if (metadata.suffix) {
      metadata.suffix = [metadata.suffix];
    }
  }],
  prefix: [undefined, (_: string, _1: string, metadata: any) => {
    if (metadata.prefix) {
      metadata.prefix = [metadata.prefix];
    }
  }],
  format: undefined,
});

const parseMarksConfig = (
  key: unknown,
  conf: unknown,
  ctx?: { prefix?: string[]; suffix?: string[] },
) => {
  if (!key || typeof key !== "string" || !key.trim()?.length) {
    throw new ArgumentInvalidError(`key should be a non empty string`);
  }

  if (!conf) {
    throw new ArgumentInvalidError(`conf should be a non empty string`);
  } else if (typeof conf === "string" && !conf.length) {
    throw new ArgumentInvalidError(`conf should be a non empty string`);
  }

  if (typeof conf === "object") {
    throw configError("invalid", key, "{}");
  } else if (typeof conf === "string") {
    const metadata = {
      type: "unkown",
      // key marks
      key: key as string,
      prefix: undefined as string[] | undefined,
      suffix: undefined as string[] | undefined,
      split_words: false,
      env: undefined as string | undefined,
      // value marks
      split_values: false,
      format: undefined as string | undefined,
      default: undefined as string | undefined,
      // string
      uppercase: false,
      lowercase: false,
      // validator marks
      required: false,
      min: undefined as number | string | Date | undefined,
      max: undefined as number | string | Date | undefined,
      //
      config: conf,
    };

    for (let i = 0; i < conf.length; i++) {
      const char = conf[i];

      if (char !== "`") {
        continue;
      }

      if (!/^[a-zA-Z]+$/.test(conf[i + 1])) {
        throw configError("syntaxis", key, conf);
      }

      let rune = conf.substring(i);

      let idx = rune.indexOf("`", 1);
      rune = rune.substring(0, idx = idx > -1 ? idx : rune.length);

      const extractRuneValue = (runeVal: string) => {
        let len = runeVal.indexOf("`");
        len = len > -1 ? len : runeVal.length;
        return { length: len, value: runeVal.substring(0, len) };
      };

      const [toggleMark, toggleMarkVal]: any = toggleMarks.find(([mark, _]) =>
        rune.startsWith(`\`${mark}`)
      ) || [];

      // toggle marks
      if (toggleMark) {
        const mark = toggleMark as keyof typeof metadata;
        // run mark validations
        toggleMarkVal?.(key, conf, metadata);
        // check duplications
        if (mark in metadata && metadata[mark]) {
          throw duplicateMarkError(mark, key, conf);
        }
        // toggle mark on metadata
        (metadata[mark] as any) = true;
        // move cur
        i += mark.length - 1;
        continue;
      }

      const [valuedMark, [valuedMarkVal, valueMarkExec] = []]: any =
        valuedMarks.find(([mark, _]) => rune.startsWith(`\`${mark}`)) || [, []];

      // valued marks
      if (valuedMark) {
        const mark = valuedMark as keyof typeof metadata;
        // run mark validations
        valuedMarkVal?.(key, conf, metadata);
        // check duplications
        if (mark in metadata && metadata[mark]) {
          throw duplicateMarkError(mark, key, conf);
        }
        const markLength = `\`${mark}:`.length;
        if (rune[markLength - 1] !== ":") {
          throw invalidValueError(mark, key, conf, rune);
        }
        const { length, value: markValue } = extractRuneValue(
          rune.substring(markLength).trim(),
        );
        // set mark value on metadata
        (metadata[mark] as any) = markValue;
        valueMarkExec?.(key, conf, metadata);
        // move cur
        i += (markLength + length) - 1;
        continue;
      }

      const type = rune.substring(1);
      if (types.some((t) => type.startsWith(t))) {
        if (metadata.type !== "unkown") {
          throw duplicateMarkError(rune, key, conf);
        }
        metadata.type = type;
        // move cur
        i += idx - 1;
        continue;
      }
    }

    if (ctx?.prefix && !metadata.prefix) {
      metadata.prefix = ctx?.prefix;
    }

    if (ctx?.suffix && !metadata.suffix) {
      metadata.suffix = ctx?.suffix;
    }

    if (!metadata.env) {
      if (metadata.split_words) {
        key = key.replace(/[A-Z]/g, "_$&");
      }
      metadata.key = (<string> key).toLowerCase();
    }

    return metadata;
  }

  throw configError("invalid", key, `${conf}`);
};

describe("parseMarksConfig()", () => {
  describe("key argument", () => {
    for (
      const invalidValue of [null, 1, "", undefined, new Date()]
    ) {
      it(`when "${invalidValue}" should throws an invalid type error`, () => {
        assertThrows(() => {
          try {
            parseMarksConfig(invalidValue, "myEnvVar");
          } catch (err) {
            assertInstanceOf(err, ArgumentInvalidError);
            assertIsError(err);
            throw err;
          }
        });
      });
    }

    it('myEnvKey:`string should return lowercased key { key:"myenvkey" }', () => {
      const result = parseMarksConfig("myEnvKey", "`string");

      assertEquals(result.key, "myenvkey");
    });

    describe("`env mark", () => {
      it('myEnvKey:`env:MY_VAR mark should override key value "myEnvKey" to "MY_VAR"', () => {
        const var_key = "myEnvKey";
        const metadataig = "`env:MY_VAR";

        const metadata = parseMarksConfig(var_key, metadataig);

        assertEquals(metadata.key, "MY_VAR");
      });

      for (
        const invalidValue of ["`env:", "`env:  ", "`env:MY_VAR `env:MY_VAR1"]
      ) {
        it(`when "${invalidValue}" should throws an error`, () => {
          assertThrows(() => {
            try {
              parseMarksConfig("myEnvVar", invalidValue);
            } catch (err) {
              assertInstanceOf(err, ArgumentInvalidError);
              assertIsError(err);
              throw err;
            }
          });
        });
      }
    });

    describe("`split_words mark", () => {
      it("when use myEnvKey`split_words, output should be {split_words:true,key:my_env_key}", () => {
        const var_key = "myEnvKey";
        const metadataig = "`split_words";

        const metadata = parseMarksConfig(var_key, metadataig);

        assertEquals(metadata.split_words, true);
        assertEquals(metadata.key, "my_env_key");
      });
    });

    describe("`prefix mark", () => {
      it("when use myEnvKey`prefix:p, output should be {prefix:'p'}", () => {
        const var_key = "myEnvKey";
        const metadataig = "`prefix:p";

        const metadata = parseMarksConfig(var_key, metadataig);

        assertEquals(metadata.prefix?.join(), "p");
      });
    });

    describe("`suffix mark", () => {
      it("when use myEnvKey`suffix:p, output should be {suffix:'p'}", () => {
        const var_key = "myEnvKey";
        const metadataig = "`suffix:p";

        const metadata = parseMarksConfig(var_key, metadataig);

        assertEquals(metadata.suffix?.join(), "p");
      });
    });
  });

  describe("config argument", () => {
    for (
      const invalidValue of ["`  invalid", null, 1, "", undefined, new Date()]
    ) {
      it(`when "${invalidValue}" should throws an invalid type error`, () => {
        assertThrows(() => {
          try {
            parseMarksConfig("myEnvVar", invalidValue);
          } catch (err) {
            assertIsError(err);
            throw err;
          }
        });
      });
    }

    describe("`types modifiers", () => {
      describe("`string mark", () => {
        it("when `string should parse", () => {
          const var_key = "myEnvKey";
          const metadataig = "`string";

          const metadata = parseMarksConfig(var_key, metadataig);

          assertEquals(metadata.type, "string");
        });
      });
      describe("`bool mark", () => {
        it("when `bool should parse", () => {
          const var_key = "myEnvKey";
          const metadataig = "`bool";

          const metadata = parseMarksConfig(var_key, metadataig);

          assertEquals(metadata.type, "bool");
        });
      });
      describe("`date mark", () => {
        it("when `date should parse", () => {
          const var_key = "myEnvKey";
          const metadataig = "`date";

          const metadata = parseMarksConfig(var_key, metadataig);

          assertEquals(metadata.type, "date");
        });
      });
    });

    describe("`default mark", () => {
      it("when `default:1 should parse", () => {
        const var_key = "myEnvKey";
        const metadataig = "`default:1";

        const metadata = parseMarksConfig(var_key, metadataig);

        assertEquals(metadata.default, "1");
      });
      it("when `default: should parse empty default", () => {
        const var_key = "myEnvKey";
        const metadataig = "`default:";

        const metadata = parseMarksConfig(var_key, metadataig);

        assertEquals(metadata.default, "");
      });
      it("when `default:  value, should parse trimmed", () => {
        const var_key = "myEnvKey";
        const metadataig = "`default:  value";
        const metadata = parseMarksConfig(var_key, metadataig);

        assertEquals(metadata.default, "value");
      });
    });

    describe("`validation modifiers", () => {
      describe("`required mark", () => {
        it("when `required should parse", () => {
          const var_key = "myEnvKey";
          const metadataig = "`required";

          const metadata = parseMarksConfig(var_key, metadataig);

          assertEquals(metadata.required, true);
        });
      });
    });

    describe("invalid checks", () => {
      for (
        const mark of [
          "`string",
          "`number",
          "`bool",
          "`date",
          "`required",
          "`default:1",
          "`env:1",
          "`split_values",
          "`bool`number`string",
        ]
      ) {
        for (
          const invalid of [
            `${mark}${mark}`,
            `${mark} ${mark}`,
            `a ${mark} z${mark}`,
            `a${mark}z${mark}`,
          ]
        ) {
          it(`when "${invalid}" should throws an error`, () => {
            const var_key = "myEnvKey";
            const metadataig = invalid;

            assertThrows(() => {
              try {
                parseMarksConfig(var_key, metadataig);
              } catch (err) {
                assertIsError(err);
                throw err;
              }
            });
          });
        }
      }
    });
  });
});

export const parse = <
  T = any,
  C = any,
>(
  vars: T,
  config: C,
  options: { debug?: boolean; prefix?: string[]; suffix?: string[] } = {
    debug: false,
    prefix: undefined,
    suffix: undefined,
  },
): any => {
  if (typeof vars !== "object") {
    throw new ArgumentInvalidError("vars argument need to be an object");
  }
  if (!config || typeof config !== "object") {
    throw new ArgumentInvalidError("config argument need to be an object");
  }
  const __env: any = vars || {};
  const env: Record<string, unknown> = options.debug ? { __env } : {},
    varsKeys = Object.keys(__env),
    configKeys = Object.keys(config);

  if (
    !configKeys.length
  ) {
    return __env;
  }

  const configs = Object.entries(config);

  const getVal = (
    key: string,
    { suffix, prefix }: { suffix?: string[]; prefix?: string[] },
  ) => {
    const varKey = varsKeys.find((k) => {
      let _prefix = undefined as string[] | undefined;
      let _suffix = undefined as string[] | undefined;

      if (prefix?.length) {
        _prefix = prefix?.filter(Boolean);
      }

      if (suffix?.length) {
        _suffix = suffix?.filter(Boolean);
      }

      let tempKey = `${_prefix?.join("") || ""}${key}${
        _suffix?.join("") || ""
      }`;

      if (k.toLowerCase() === tempKey.toLowerCase()) {
        return true;
      }

      tempKey = `${_prefix?.join("_") || ""}_${key}_${
        _suffix?.join("_") || ""
      }`;

      tempKey = tempKey.endsWith("_")
        ? tempKey.substring(0, tempKey.length - 1)
        : tempKey;

      return k.toLowerCase() === tempKey.toLowerCase();
    });

    if (varKey && varKey in __env) {
      return __env[varKey] || undefined;
    }

    return undefined;
  };

  for (const [key, conf] of configs) {
    try {
      if (typeof conf === "object") {
        const __prefix = conf.__prefix ?? key;
        const __suffix = conf.__suffix ?? "";
        delete conf.__prefix;
        delete conf.__suffix;

        const child = parse({ ...__env }, conf, {
          ...options,
          prefix: [...options.prefix || [], __prefix] as string[],
          suffix: [...options?.suffix || [], __suffix] as string[],
        });

        env[key] = child;
      } else {
        if (!conf) {
          const val = getVal(key, options);

          if (val) {
            env[key] = val;
            continue;
          }
        }

        const metadata = parseMarksConfig(
          key,
          conf,
          options,
        );

        const {
          key: valKey,
          default: def,
          required,
          split_values,
          prefix,
          suffix,
          uppercase,
          lowercase,
        } = metadata;

        let { type } = metadata;

        let val = env[key] = getVal(valKey, { prefix, suffix }) || def;
        const original = val;
        switch (true) {
          case type === "number":
            if (split_values) {
              env[key] = (val?.split(",") || "").map(Number);
            } else {
              env[key] = Number(val);
            }
            break;
          case type === "bool":
            if (split_values) {
              env[key] = (val?.split(",") || "").map((v: string) =>
                v === "true"
              );
            } else {
              env[key] = ["y", "yes", "true", "t", "on", "1", true, 1].includes(
                val.toLowerCase(),
              );
            }
            break;
          case type === "string":
            if (split_values) {
              env[key] = val?.split(",") || "";
            }
            break;
          case type === "date":
            if (split_values) {
              env[key] = (val?.split(",") || "").map((v: string) =>
                new Date(v)
              );
            } else {
              env[key] = new Date(val);
            }
            break;
        }

        if (split_values && type === "unkown") {
          env[key] = val?.split(",") || "";
          metadata.type = type = "string";
        }

        if (lowercase) {
          try {
            env[key] = (env[key] as string)?.toLowerCase?.();
          } catch (_) {
            // noop
          }
        }

        if (uppercase) {
          try {
            env[key] = (env[key] as string)?.toUpperCase?.();
          } catch (_) {
            // noop
          }
        }

        val = env[key];

        if (required && !val) {
          throw configError("required", key, original, "missing value");
        }

        if (
          type === "number" &&
          (!split_values && isNaN(val) || split_values && val?.some(isNaN))
        ) {
          throw invalidNumberError(key, original, val);
        }

        if (
          type === "date" && (!split_values && isNaN(val?.getTime() || NaN) ||
            split_values &&
              val?.some((v: Date) => isNaN(v?.getTime() || NaN)))
        ) {
          throw invalidDateError(key, original, val);
        }

        if (typeof metadata.min !== "undefined") {
          if (type === "string" || type === "number" || type === "date") {
            const min = type === "date"
              ? new Date(metadata.min)
              : Number(metadata.min);

            if (isNaN(typeof min === "number" ? min : min.getTime())) {
              throw configError(
                "min",
                key,
                original,
                "should be a valid number, " + min,
              );
            }

            if (split_values && Array.isArray(val)) {
              val.forEach((v) => {
                const test = type === "number" || type === "date"
                  ? v
                  : v?.length;

                if (test < min) {
                  throw configError(
                    "min",
                    key,
                    original,
                    "value should be largest, " + test,
                  );
                }
              });
            }

            const test = type === "number" || type === "date"
              ? val
              : val?.length;

            if (test < min) {
              throw configError(
                "min",
                key,
                original,
                "value should be largest, " + test,
              );
            }
          }
        }

        if (typeof metadata.max !== "undefined") {
          if (type === "string" || type === "number" || type === "date") {
            const max = type === "date"
              ? new Date(metadata.max)
              : Number(metadata.max);

            if (isNaN(typeof max === "number" ? max : max.getTime())) {
              throw configError(
                "max",
                key,
                original,
                "should be a valid number, " + max,
              );
            }

            if (split_values && Array.isArray(val)) {
              val.forEach((v) => {
                const test = type === "number" || type === "date"
                  ? v
                  : v?.length;

                if (test > max) {
                  throw configError(
                    "max",
                    key,
                    original,
                    "value length exceeded, " + test,
                  );
                }
              });
            }

            const test = type === "number" || type === "date"
              ? val
              : val?.length;

            if (test > max) {
              throw configError(
                "max",
                key,
                original,
                "value length exceeded, " + test,
              );
            }
          }
        }
      }
    } catch (err) {
      throw err;
    }
  }

  return env;
};

describe("parse()", () => {
  it("should thorws an error when is called with invalid arguments", () => {
    assertThrows(() => {
      parse(undefined, undefined);
    });
    assertThrows(() => {
      parse({ ENV: "" }, undefined);
    });
  });

  it("should return env if is called when empty config", () => {
    const result = parse({ myEnvVar: 1 }, {});

    assertEquals(result, { myEnvVar: 1 });
  });

  describe("`date", () => {
    it("when `string`min:a should throws an error if parsed is NaN ", () => {
      const env = {
        myEnvVar: "boom",
      };

      const conf = {
        myEnvVar: "`string`min:a",
      };

      assertThrows(() => parse(env, conf));
    });
    it("when `date`min:1989-05-20T00:00:00.000Z should throws an error if less length parsed ", () => {
      const env = {
        myEnvVar: "1989-05-19T00:00:00.000Z",
      };

      const conf = {
        myEnvVar: "`date`min:1989-05-20T00:00:00.000Z",
      };

      assertThrows(() => parse(env, conf));
    });
    it("when `date`max:a should throws an error if parsed is NaN ", () => {
      const env = {
        myEnvVar: "boom",
      };

      const conf = {
        myEnvVar: "`date`max:a",
      };

      assertThrows(() => parse(env, conf));
    });
    it("when `date`max:1989-05-20T00:00:00.000Z should throws an error if length parsed is bigger", () => {
      const env = {
        myEnvVar: "1989-05-21T00:00:00.000Z",
      };

      const conf = {
        myEnvVar: "`date`max:1989-05-20T00:00:00.000Z",
      };

      assertThrows(() => parse(env, conf));
    });
    it("whe use `split_values should parse to date[] from env", () => {
      const env = {
        myEnvVar:
          "1989-05-20T00:00:00.000Z,1989-05-20T00:00:00.000Z,1989-05-20T00:00:00.000Z",
      };

      const conf = {
        myEnvVar: "`split_values`date",
      };

      const result = parse(env, conf);

      assertEquals(result.myEnvVar, [
        new Date("1989-05-20T00:00:00.000Z"),
        new Date("1989-05-20T00:00:00.000Z"),
        new Date("1989-05-20T00:00:00.000Z"),
      ]);
    });

    it("whe use `split_values should parse to date[] from default", () => {
      const env = {
        myEnvVar: undefined,
      };

      const conf = {
        myEnvVar:
          "`split_values`date`default:1989-05-20T00:00:00.000Z,1989-05-20T00:00:00.000Z,1989-05-20T00:00:00.000Z",
      };

      const result = parse(env, conf);

      assertEquals(result.myEnvVar, [
        new Date("1989-05-20T00:00:00.000Z"),
        new Date("1989-05-20T00:00:00.000Z"),
        new Date("1989-05-20T00:00:00.000Z"),
      ]);
    });

    it("whe use `split_values should throws an error if can't parse to date some value", () => {
      const env = {
        myEnvVar: undefined,
      };

      const conf = {
        myEnvVar: "`split_values`date`default:a,b,c",
      };

      assertThrows(() => parse(env, conf));
    });

    for (
      const [input, expected] of [
        ["1989-05-20T00:00:00.000Z", new Date("1989-05-20T00:00:00.000Z")],
        ["AAAA", Error],
      ]
    ) {
      it(`should parse '${input}' to ${expected} from default`, () => {
        const env = {};

        const conf = {
          myEnvVar: `\`default:${input}\`date`,
        };

        if (Error !== expected) {
          const result = parse(env, conf);

          assertEquals(result, { myEnvVar: expected });
        } else {
          assertThrows(() => parse(env, conf));
        }
      });

      it(`should parse '${input}' to ${expected} from env`, () => {
        const env = {
          myEnvVar: input,
        };

        const conf = {
          myEnvVar: "`date",
        };

        if (Error !== expected) {
          const result = parse(env, conf);

          assertEquals(result, { myEnvVar: expected });
        } else {
          assertThrows(() => parse(env, conf));
        }
      });
    }
  });

  describe("`bool", () => {
    for (
      const [input, expected] of [
        ["true", true],
        ["yes", true],
        ["on", true],
        ["y", true],
        ["1", true],
        ["false", false],
        ["no", false],
        ["n", false],
        ["off", false],
        ["0", false],
        ["always-false", false],
      ]
    ) {
      it(`should parse '${input}' to ${expected} from default`, () => {
        const env = {};

        const conf = {
          myEnvVar: `\`default:${input}\`bool`,
        };

        const result = parse(env, conf);

        assertEquals(result, { myEnvVar: expected });
      });

      it(`should parse '${input}' to ${expected} from env`, () => {
        const env = {
          myEnvVar: input,
        };

        const conf = {
          myEnvVar: "`bool",
        };

        const result = parse(env, conf);

        assertEquals(result, { myEnvVar: expected });
      });
    }
  });

  describe("`string", () => {
    it("when `string`min:a should throws an error if parsed is NaN ", () => {
      const env = {
        myEnvVar: "boom",
      };

      const conf = {
        myEnvVar: "`string`min:a",
      };

      assertThrows(() => parse(env, conf));
    });
    it("when `string`min:4 should throws an error if less length parsed ", () => {
      const env = {
        myEnvVar: "boom",
      };

      const conf = {
        myEnvVar: "`string`min:5",
      };

      assertThrows(() => parse(env, conf));
    });
    it("when `string`max:a should throws an error if parsed is NaN ", () => {
      const env = {
        myEnvVar: "boom",
      };

      const conf = {
        myEnvVar: "`string`max:a",
      };

      assertThrows(() => parse(env, conf));
    });
    it("when `string`max:4 should throws an error if length parsed is bigger", () => {
      const env = {
        myEnvVar: "booom",
      };

      const conf = {
        myEnvVar: "`string`max:4",
      };

      assertThrows(() => parse(env, conf));
    });
    it("when `string`uppercase`lowercase should throws an error", () => {
      const env = {
        myEnvVar: "hello",
      };

      const conf = {
        myEnvVar: "`string`uppercase`lowercase",
      };

      assertThrows(() => parse(env, conf));
    });
    it("when `string`uppercase should parse uppercased from env", () => {
      const env = {
        myEnvVar: "hello",
      };

      const conf = {
        myEnvVar: "`string`uppercase",
      };

      const result = parse(env, conf);

      assertEquals(result.myEnvVar, "HELLO");
    });
    it("when `string should parse spaced values from env", () => {
      const env = {
        myEnvVar: "hello hello",
      };

      const conf = {
        myEnvVar: "`string",
      };

      const result = parse(env, conf);

      assertEquals(result.myEnvVar, "hello hello");
    });
    it("when `string`default:hello hello should parse spaced values from default", () => {
      const env = {
        myEnvVar: undefined,
      };

      const conf = {
        myEnvVar: "`string`default:hello hello",
      };

      const result = parse(env, conf);

      assertEquals(result.myEnvVar, "hello hello");
    });

    it("when `default:hello hello`string should parse spaced values from default", () => {
      const env = {
        myEnvVar: undefined,
      };

      const conf = {
        myEnvVar: "`default:hello hello`string",
      };

      const result = parse(env, conf);

      assertEquals(result.myEnvVar, "hello hello");
    });

    it("when `string`lowercase should parse lowercased from env", () => {
      const env = {
        myEnvVar: "HELLO",
      };

      const conf = {
        myEnvVar: "`string`lowercase",
      };

      const result = parse(env, conf);

      assertEquals(result.myEnvVar, "hello");
    });
    it("should thorws an error when missing required", () => {
      assertThrows(() => {
        const env = {
          myEnvVar: undefined,
        };

        const conf = {
          myEnvVar: "`string`required",
        };

        parse(env, conf);
      });
    });

    it("whe use `split_values should parse to string[] from env", () => {
      const env = {
        myEnvVar: "1,2,3",
      };

      const conf = {
        myEnvVar: "`split_values`string",
      };

      const result = parse(env, conf);

      assertEquals(result.myEnvVar, ["1", "2", "3"]);
    });

    it("whe use `split_values should parse to string[] from defualt", () => {
      const env = {
        myEnvVar: undefined,
      };

      const conf = {
        myEnvVar: "`split_values`string`default:1,2,3",
      };

      const result = parse(env, conf);

      assertEquals(result.myEnvVar, ["1", "2", "3"]);
    });
  });

  describe("`number", () => {
    it("when `split_values`number`min:4 should throws an error", () => {
      const env = {
        myEnvVar: "1,2,3",
      };

      const conf = {
        myEnvVar: "`split_values`number`min:4",
      };

      assertThrows(() => parse(env, conf));
    });
    it("when `number`min:a should throws an error if parsed is NaN ", () => {
      const env = {
        myEnvVar: "boom",
      };

      const conf = {
        myEnvVar: "`number`min:a",
      };

      assertThrows(() => parse(env, conf));
    });
    it("when `number`min:4 should throws an error if less length parsed ", () => {
      const env = {
        myEnvVar: 1,
      };

      const conf = {
        myEnvVar: "`number`min:5",
      };

      assertThrows(() => parse(env, conf));
    });
    it("when `split_values`number`max:4 should throws an error", () => {
      const env = {
        myEnvVar: "5,6,7",
      };

      const conf = {
        myEnvVar: "`split_values`number`max:4",
      };

      assertThrows(() => parse(env, conf));
    });
    it("when `number`max:a should throws an error if parsed is NaN ", () => {
      const env = {
        myEnvVar: "boom",
      };

      const conf = {
        myEnvVar: "`number`max:a",
      };

      assertThrows(() => parse(env, conf));
    });
    it("when `number`max:4 should throws an error if length parsed is bigger", () => {
      const env = {
        myEnvVar: "5",
      };

      const conf = {
        myEnvVar: "`number`max:4",
      };

      assertThrows(() => parse(env, conf));
    });
    it("whe use `split_values should parse to number[] from env", () => {
      const env = {
        myEnvVar: "1,2,3",
      };

      const conf = {
        myEnvVar: "`split_values`number",
      };

      const result = parse(env, conf);

      assertEquals(result.myEnvVar, [1, 2, 3]);
    });

    it("whe use `split_values should parse to number[] from default", () => {
      const env = {
        myEnvVar: undefined,
      };

      const conf = {
        myEnvVar: "`split_values`number`default:1,2,3",
      };

      const result = parse(env, conf);

      assertEquals(result.myEnvVar, [1, 2, 3]);
    });

    it("whe use `split_values with NaN values should throws an error", () => {
      const env = {
        myEnvVar: "a,b,c",
      };

      const conf = {
        myEnvVar: "`split_values`number",
      };

      assertThrows(() => parse(env, conf));
    });

    for (
      const [input, expected] of [
        ["1", 1],
        ["1.10", 1.10],
        ["-1.10", -1.10],
        ["-1", -1],
        ["0xA", 10],
        ["0o12", 10],
        ["0b1010", 10],
        ["a", Error],
        ["http://site.com", Error],
      ]
    ) {
      it(
        Error !== expected
          ? `should parse '${input}' to ${expected} from default`
          : `when '${input}' should throws an error from default`,
        () => {
          const env = {};

          const conf = {
            myEnvVar: `\`default:${input}\`number`,
          };

          if (Error !== expected) {
            const result = parse(env, conf);

            assertEquals(result, { myEnvVar: expected });
          } else {
            assertThrows(() => parse(env, conf));
          }
        },
      );

      it(
        Error !== expected
          ? `should parse '${input}' to ${expected} from env`
          : `when '${input}' should throws an error from env`,
        () => {
          const env = {
            MYENVVAR: input,
          };

          const conf = {
            myEnvVar: "`number",
          };
          if (Error !== expected) {
            const result = parse(env, conf);

            assertEquals(result, { myEnvVar: expected });
          } else {
            assertThrows(() => parse(env, conf));
          }
        },
      );
    }
  });
});

it("should throws if required missing", () => {
  const env = {};

  const config = {
    port: "`required",
  };

  assertThrows(() => parse(env, config));
});

describe("complex marks", () => {
  it("should parse config", () => {
    const env = {
      MYAPP_PORT: "3003",
      MYAPP_SECRETS_SECRET1: "secret1",
      MYAPP_SECRETS_SECRET2: "secret2",
      MYAPP_USERS: "1,2,3",
      MYAPP_EPOCH: "1989-05-20T00:00:00.000Z",
    };

    const config = {
      port: "`number`env:MYAPP_PORT",
      myapp: {
        types: "`number`split_values`default:1,2,3",
        secrets: {
          secret1: "`string",
        },
        epoch: "`date",
        users: "`string`split_values",
        users_numbers: "`env:users`number`split_values",
      },
      other: {
        structure: {
          superSecret: "`string`env:SECRETS`prefix:myapp`suffix:secret2",
        },
      },
    };

    // parse marks
    const parsed = parse(env, config);

    /*
    OUTPUT
    {
      port: 3003,
      myapp: {
        types: [ 1, 2, 3 ],
        secrets: { secret1: "secret1" },
        epoch: 1989-05-20T00:00:00.000Z,
        users: [ "1", "2", "3" ],
        users_numbers: [ 1, 2, 3 ]
      },
      other: { structure: { superSecret: "secret2" } }
    }
    */

    assertEquals(parsed.port, 3003);
    assertEquals(parsed.myapp.secrets.secret1, "secret1");
    assertEquals(parsed.other.structure.superSecret, "secret2");
    assertEquals(parsed.myapp.users, ["1", "2", "3"]);
    assertEquals(parsed.myapp.users_numbers, [1, 2, 3]);
    assertEquals(parsed.myapp.types, [1, 2, 3]);
    assertEquals(parsed.myapp.epoch, new Date("1989-05-20T00:00:00.000Z"));
  });

  it("should parse prefixed config", () => {
    const env = {
      MYAPP_PORT: "3003",
      MYAPP_SECRETS_SECRET1: "secret1",
      MYAPP_SECRETS_SECRET2: "secret2",
    };

    const config = {
      port: "`number",
      s1: "`string`env:SECRETS_SECRET1",
      s2: "`string`env:SECRETS_SECRET2",
    };

    const parsed = parse(env, config, { prefix: ["myapp"] });

    assertEquals(parsed.port, 3003);
    assertEquals(parsed.s1, "secret1");
    assertEquals(parsed.s2, "secret2");
  });

  it("should parse config undefined from env", () => {
    const env = {
      MYAPP_PORT: "3003",
    };

    const config = {
      port: undefined,
    };

    const parsed = parse(env, config, { prefix: ["myapp"] });

    assertEquals(parsed.port, "3003");
  });

  it("should parse nested config from env", () => {
    const env = {
      MYAPP_PORT: "3003",
    };

    const config = {
      myapp: {
        port: undefined,
      },
    };

    const parsed = parse(env, config);

    assertEquals(parsed.myapp.port, "3003");
  });

  it("should parse super nested config", () => {
    const env = {
      MYAPP_super_nest_PORT: "3003",
    };

    const config = {
      myapp: {
        super: {
          nest: {
            port: undefined,
          },
        },
      },
    };

    const parsed = parse(env, config);

    assertEquals(parsed.myapp.super.nest.port, "3003");
  });

  it("should parse super nested `number", () => {
    const env = {
      MYAPP_super_nest_PORT: "3003",
    };

    const config = {
      myapp: {
        super: {
          nest: {
            port: "`number",
          },
        },
      },
    };

    const parsed = parse(env, config);

    assertEquals(parsed.myapp.super.nest.port, 3003);
  });

  it("should parse super nested `number with prefix override", () => {
    const env = {
      MYAPP_SUB_P1: "1",
      MYAPP_SUB_P2: "2",
      MYAPP_SUB_P3: "3",
    };

    const config = {
      myapp: {
        ignoredPrefix: {
          __prefix: "",
          sub: {
            p1: "`number",
            p2: "`number",
            p3: "`number",
          },
        },
      },
    };

    const parsed = parse(env, config);

    assertEquals(parsed.myapp.ignoredPrefix.sub, { p1: 1, p2: 2, p3: 3 });
  });
});
