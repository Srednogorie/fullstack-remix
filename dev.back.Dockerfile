FROM public.ecr.aws/lambda/python:3.11

RUN yum install vim-enhanced -y

RUN mkdir -p /var/task/
COPY ./backend/pyproject.toml ./backend/poetry.lock /var/task/

RUN curl -sSL https://install.python-poetry.org | python3.11 -
RUN cp $HOME/.local/bin/poetry /usr/local/bin
WORKDIR /var/task/
RUN poetry config virtualenvs.create false
RUN poetry install
