import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {prisma} from '../../core/database/db';
import {GlobalRole} from '@prisma/client';
import {PASSKEY, SALT_ROUNDS} from '../../core/config/constants';
import {access} from 'node:fs';

export const registerUser = async (
  name: string,
  username: string,
  email: string,
  password: string,
) => {
  /*Our system enforces that both email and username must be unique,therefore
    a user must be notified if either email or username already exists. */
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{email: email}, {username: username}],
    },
    select: {email: true, username: true},
  });
  if (existingUser !== null) {
    if (existingUser.email === email) throw new Error('ERROR_12');
    if (existingUser.username === username) throw new Error('ERROR_13');
  }
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  /*Passwords should always be hashed before storing, never store plain text passwords.
    We use bcrypt to hash passwords, which is a secure hashing algorithm designed for passwords.
    First user in the system becomes a Global Admin automatically.*/
  const userCount = await prisma.user.count();
  /*Below is a smart way to assign admin role,it is convenient to
    assume that the first user to register is an admin (in fact, the dev, like me :)*/
  const assignedRole = userCount === 0 ? GlobalRole.ADMIN : GlobalRole.USER;
  const newUser = await prisma.user.create({
    data: {
      name: name,
      username: username,
      email: email,
      password: hashedPassword,
      role: assignedRole,
    },
  }); //Create a user in the database with hashed password
  return {
    id: newUser.id,
    name: newUser.name,
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
    avatar: newUser.avatar,
  }; //Return an ok status, along with query data
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({where: {email: email}});
  if (!user) throw new Error('ERROR_14');
  const isMatch = await bcrypt.compare(password, user.password);
  /*Interesting note: we don't use '==', we use bcrypt's compare because of two reasons:
    a) user.password is a hashed password, not plain text, so we can't directly compare it with the plain text password from the request.
    b) one form of side channel attack is when an attacker tries to guess the password by measuring the time it takes for the server to respond. If we use '==',
    it might return faster for wrong passwords than for partially correct ones, giving clues to the attacker. bcrypt's compare function is designed to
    prevent this attack.*/
  if (!isMatch) throw new Error('ERROR_14');
  /*What is signing? First, a signature is created using the header and payload, and the secret key . When server receives the token, it verifies the signature.
    this prevents tampering,as change in payload => change in signature.*/
  const refreshToken = jwt.sign({id: user.id}, PASSKEY, {
    expiresIn: '7d',
  }); //A refresh token is used to obtain more access tokens
  const accessToken = jwt.sign({id: user.id}, PASSKEY, {expiresIn: '1h'});
  const updatedUser = await prisma.user.update({
    where: {id: user.id},
    data: {refreshToken: refreshToken},
  }); // We update the refresh token at login.
  await prisma.user.update({
    where: {id: user.id},
    data: {refreshToken: refreshToken},
  });
  return {user, accessToken, refreshToken};
};

export const newAccessToken = async (refreshToken: string) => {
  const decoded = jwt.verify(refreshToken, PASSKEY) as {id: string}; //this returns the original payload (userId)
  const userId = decoded.id; //never trust the user!
  const user = await prisma.user.findUnique({
    where: {id: userId},
  });
  if (!user) throw new Error('ERROR_15'); //check if user actually exists
  if (user.refreshToken != refreshToken) throw new Error('ERROR_14'); //check if the refresh token matches the one in database
  //we authorize a new access token as long as the refresh token matches.
  const newAccessToken = jwt.sign({id: userId}, PASSKEY, {expiresIn: '1h'});
  return newAccessToken;
};

export const logoutUser = async (userId: string) => {
  //when we logout, we must clear the old refresh token.
  await prisma.user.update({
    where: {id: userId},
    data: {refreshToken: null},
  });
  return {ok: true};
};
