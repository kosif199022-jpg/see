export default {
  async fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return Response.json({
        status: 'ok',
        service: 'SEE Audit Worker'
      });
    }

    return Response.json({
      name: 'SEE Audit Platform',
      version: '0.1.0'
    });
  }
};
