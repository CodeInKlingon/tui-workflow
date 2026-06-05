import { Effect } from "effect";
import { type Component, createSignal } from 'solid-js';
import { DialogContainer, dialogEffect } from './dialog';
import { DialogCancelled } from './errors';

interface ConfirmDialogProps {
  message: string;
  onResolve: (value: boolean) => void;
  onReject: (reason?: any) => void;
}

const ConfirmDialog: Component<ConfirmDialogProps> = (props) => {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'white',
      padding: '20px',
      border: '1px solid #ccc',
      'border-radius': '8px',
      'box-shadow': '0 2px 10px rgba(0,0,0,0.1)',
      'z-index': '1000',
    }}>
      <p>{props.message}</p>
      <div style={{ display: 'flex', gap: '10px', 'margin-top': '20px' }}>
        <button onClick={() => props.onResolve(true)}>Yes</button>
        <button onClick={() => props.onResolve(false)}>No</button>
        <button onClick={() => props.onReject('User cancelled')}>Cancel</button>
      </div>
    </div>
  );
};

const Example: Component = () => {
  const [result, setResult] = createSignal<string>('No result yet');

  const showDialog = () => {
    const program = dialogEffect.add<boolean>((resolve, reject) => (
      <ConfirmDialog
        message="Are you sure?"
        onResolve={resolve}
        onReject={reject}
      />
    )).pipe(
      Effect.catchTag("DialogCancelled", () => Effect.succeed(false)),
    );

    Effect.runPromise(program).then((answer) => {
      setResult(`User answered: ${answer ? 'Yes' : 'No'}`);
    });
  };

  return (
    <div>
      <button onClick={showDialog}>Show Dialog</button>
      <p>{result()}</p>
    </div>
  );
};

const App: Component = () => {
  return (
    <div>
      <h1>Dialog Service Example</h1>
      <Example />
      <DialogContainer />
    </div>
  );
};

export default App;