export const getHealth = async () => {
  //if we reached here, server running fine, so we return ok status.
  return {status: 'ok', timestamp: Date.now()};
};
