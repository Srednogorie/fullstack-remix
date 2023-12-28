FROM python:3.11

RUN apt update
RUN apt install vim which -y

WORKDIR /code
COPY /backend /code

RUN curl -sSL https://install.python-poetry.org | python3.11 -
RUN cp $HOME/.local/bin/poetry /usr/local/bin

ENV PYTHONPATH "${PYTHONPATH}:/code"
RUN poetry config virtualenvs.create false
RUN poetry install
