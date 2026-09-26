// Os decorators do tsyringe rodam na importação das classes e precisam do
// reflect-metadata carregado antes, mesmo quando o teste instancia o service com `new`.
import 'reflect-metadata';
