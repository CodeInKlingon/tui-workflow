import { type Component, createSignal } from 'solid-js';
import { DialogContainer, dialogService } from './dialog';

// Example dialog component
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

// Example usage
const Example: Component = () => {
  const [result, setResult] = createSignal<string>('No result yet');

  const showDialog = async () => {
    try {
      const answer = await dialogService.add<boolean>((resolve, reject) => (
        <ConfirmDialog
          message="Are you sure?"
          onResolve={resolve}
          onReject={reject}
        />
      ));
      setResult(`User answered: ${answer ? 'Yes' : 'No'}`);
    } catch (error) {
      setResult(`Dialog cancelled: ${error}`);
    }
  };

  return (
    <div>
      <button onClick={showDialog}>Show Dialog</button>
      <p>{result()}</p>
    </div>
  );
};

// App setup - just include DialogContainer once in your app
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
