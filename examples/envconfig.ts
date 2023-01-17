import { parse } from "../src/envconfig.ts";

const env = {
  MYAPP_PORT: "3003",
};

const envconfig = {
  myapp: {
    bool: {
      optionalAliasArray: "`bool[]",
      requiredAliasArray: "`bool[]`required",
      optional: "`bool",
      required: "`bool`required",
      optionalSplitValues: "`bool`split_values",
      requiredSplitValues: "`bool`split_values`required",
    },
    number: {
      optionalAliasArray: "`number[]",
      requiredAliasArray: "`number[]`required",
      optional: "`number",
      required: "`number`required",
      optionalSplitValues: "`number`split_values",
      requiredSplitValues: "`number`split_values`required",
    },
    string: {
      optionalAliasArray: "`string[]",
      requiredAliasArray: "`string[]`required",
      optional: "`string",
      required: "`string`required",
      optionalSplitValues: "`string`split_values",
      requiredSplitValues: "`string`split_values`required",
    },
    date: {
      optionalAliasArray: "`date[]",
      requiredAliasArray: "`date[]`required",
      optional: "`date",
      required: "`date`required",
      optionalSplitValues: "`date`split_values",
      requiredSplitValues: "`date`split_values`required",
    },
  },
} as const;

const out = parse<any, typeof envconfig>(env, envconfig);

// bool[]
out.myapp.bool.optionalAliasArray;
let bool_optionalAliasArray: typeof out.myapp.bool.optionalAliasArray =
  undefined as boolean[] | undefined;
void bool_optionalAliasArray;

// bool[]`required
out.myapp.bool.requiredAliasArray;
let bool_requiredAliasArray: typeof out.myapp.bool.requiredAliasArray = [true];
void bool_requiredAliasArray;

// bool
out.myapp.bool.optional;
let bool_optional: typeof out.myapp.bool.optional = undefined as
  | boolean
  | undefined;
void bool_optional;

// bool`required
out.myapp.bool.required;
let bool_required: typeof out.myapp.bool.required = true;
void bool_required;

// `bool`split_values
out.myapp.bool.optionalSplitValues;
let bool_optionalSplitValues: typeof out.myapp.bool.optionalSplitValues =
  undefined as boolean[] | undefined;
void bool_optionalSplitValues;

// `bool`split_values`required
out.myapp.bool.requiredSplitValues;
let bool_requiredSplitValues: typeof out.myapp.bool.requiredSplitValues = [
  true,
];
void bool_requiredSplitValues;

// number[]
out.myapp.number.optionalAliasArray;
let number_optionalAliasArray: typeof out.myapp.number.optionalAliasArray =
  undefined as number[] | undefined;
void number_optionalAliasArray;

// number[]`required
out.myapp.number.requiredAliasArray;
let number_requiredAliasArray: typeof out.myapp.number.requiredAliasArray = [
  1,
];
void number_requiredAliasArray;

// number
out.myapp.number.optional;
let number_optional: typeof out.myapp.number.optional = undefined as
  | number
  | undefined;
void number_optional;

// number`required
out.myapp.number.required;
let number_required: typeof out.myapp.number.required = 1;
void number_required;

// `number`split_values
out.myapp.number.optionalSplitValues;
let number_optionalSplitValues: typeof out.myapp.number.optionalSplitValues =
  undefined as number[] | undefined;
void number_optionalSplitValues;

// `number`split_values`required
out.myapp.number.requiredSplitValues;
let number_requiredSplitValues: typeof out.myapp.number.requiredSplitValues = [
  1,
];
void number_requiredSplitValues;

// string[]
out.myapp.string.optionalAliasArray;
let string_optionalAliasArray: typeof out.myapp.string.optionalAliasArray =
  undefined as string[] | undefined;
void string_optionalAliasArray;

// string[]`required
out.myapp.string.requiredAliasArray;
let string_requiredAliasArray: typeof out.myapp.string.requiredAliasArray = [
  "",
];
void string_requiredAliasArray;

// string
out.myapp.string.optional;
let string_optional: typeof out.myapp.string.optional = undefined as
  | string
  | undefined;
void string_optional;

// string`required
out.myapp.string.required;
let string_required: typeof out.myapp.string.required = "";
void string_required;

// `string`split_values
out.myapp.string.optionalSplitValues;
let string_optionalSplitValues: typeof out.myapp.string.optionalSplitValues =
  undefined as string[] | undefined;
void string_optionalSplitValues;

// `string`split_values`required
out.myapp.string.requiredSplitValues;
let string_requiredSplitValues: typeof out.myapp.string.requiredSplitValues = [
  "",
];
void string_requiredSplitValues;

// date[]
out.myapp.date.optionalAliasArray;
let date_optionalAliasArray: typeof out.myapp.date.optionalAliasArray =
  undefined as Date[] | undefined;
void date_optionalAliasArray;

// date[]`required
out.myapp.date.requiredAliasArray;
let date_requiredAliasArray: typeof out.myapp.date.requiredAliasArray = [
  new Date(),
];
void date_requiredAliasArray;

// date
out.myapp.date.optional;
let date_optional: typeof out.myapp.date.optional = undefined as
  | Date
  | undefined;
void date_optional;

// date`required
out.myapp.date.required;
let date_required: typeof out.myapp.date.required = new Date();
void date_required;

// `date`split_values
out.myapp.date.optionalSplitValues;
let date_optionalSplitValues: typeof out.myapp.date.optionalSplitValues =
  undefined as Date[] | undefined;
void date_optionalSplitValues;

// `date`split_values`required
out.myapp.date.requiredSplitValues;
let date_requiredSplitValues: typeof out.myapp.date.requiredSplitValues = [
  new Date(),
];
void date_requiredSplitValues;
