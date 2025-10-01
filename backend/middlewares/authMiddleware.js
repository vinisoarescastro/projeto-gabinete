import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) =>  {
    try {
        // Pegar token do header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Token não fornecido.'
            });
        }

        // Formato esperado: "Bearer TOKEN_AQUI"
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Formato de token inválido'
            });
        }

        // Pegar token do header Authorization
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Adicionar dados do usuário na requisição
        req.usuario = decoded

        next(); // continua pra próxima função (a rota)

    } catch (error) {
        return res.status(401).json({
            sucesso: false,
            mensagem: 'Token Inválido ou expirado'
        });
    }
}