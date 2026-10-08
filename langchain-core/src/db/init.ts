import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";

const PG_DB = process.env.DB ?? "";

export const initStore = async (schema: string = "custom") => {
  const pgStore = PostgresStore.fromConnString(PG_DB, {
    schema,
  });

  await pgStore.setup();

  return pgStore;
};

export const initCheckpointer = async (schema: string = "custom") => {
  const pgCheckpointer = PostgresSaver.fromConnString(PG_DB, {
    schema,
  });

  await pgCheckpointer.setup();

  return pgCheckpointer;
};
