FROM python:3.11

# RUN yum install which -y

WORKDIR /code
COPY . /code

RUN curl -sSL https://install.python-poetry.org | python3.11 -
RUN cp $HOME/.local/bin/poetry /usr/local/bin

RUN poetry config virtualenvs.create false
RUN poetry install

# Expose the port on which the application will run
EXPOSE 8000

# Run the FastAPI application using uvicorn server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]